//! Fred Editor – dokumentmotor i WebAssembly.
//!
//! All dokumentlogik (sessionstillstånd, global parametersubstitution,
//! undo/redo, sök & ersätt, sessionsfiler) körs i den här modulen.
//! JavaScript-skalet är enbart rendering och inmatning.
//!
//! ABI: rå WASM utan bindgen. Anrop sker med JSON in / JSON ut:
//!   fred_alloc(len) -> ptr            allokera requestbuffert
//!   fred_cmd(ptr, len) -> ptr         kör kommando; svaret är
//!                                     [u32 LE längd][utf8-json]
//!   fred_free(ptr, len)               frigör svarsbuffert (len = 4 + json-längd)

use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use std::cell::RefCell;

// ---------------------------------------------------------------------------
// Informationsmodell (speglar packages/shared/src/types.ts)
// ---------------------------------------------------------------------------

/// Stildefinition enligt kravspec 6.0. Alla attribut valfria; utelämnat
/// attribut ärvs (fält/block -> mallens defaultStyle -> grundstil).
#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
struct StyleDef {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    font_family: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    font_size_pt: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    bold: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    italic: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    underline: Option<bool>,
}

/// Position i sidhuvudets/sidfotens 3x3-matris (kravspec 2.1).
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct HfPosition {
    col: String, // "left" | "center" | "right"
    row: String, // "top" | "middle" | "bottom"
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
struct Organisation {
    id: String,
    name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    logo_data_url: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ParameterOption {
    value: String,
    label: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ParameterDef {
    id: String,
    label: String,
    #[serde(rename = "type")]
    ptype: String,
    #[serde(default)]
    default_value: Option<Value>,
    #[serde(default)]
    options: Option<Vec<ParameterOption>>,
    #[serde(default)]
    children: Option<Vec<ParameterDef>>,
    #[serde(default)]
    show_when: Option<Value>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ContentBlock {
    id: String,
    title: String,
    #[serde(rename = "type")]
    btype: String, // "locked" | "editable"
    placement: String, // "fixed" | "free"
    content: String,
    order: i64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    style: Option<StyleDef>,
    /// Villkor mellan block (kravspec V13): blocket visas bara när
    /// parameterns aktuella värde är exakt `equals`.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    visible_when: Option<BlockCondition>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct BlockCondition {
    parameter_id: String,
    equals: Value,
}

/// Block utan villkor visas alltid; annars krävs exakt värdematchning.
fn block_visible(block: &ContentBlock, values: &Map<String, Value>) -> bool {
    match &block.visible_when {
        None => true,
        Some(cond) => values.get(&cond.parameter_id).unwrap_or(&Value::Null) == &cond.equals,
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct HeaderFooterField {
    id: String,
    kind: String, // "logo" | "organisation" | "text"
    #[serde(default)]
    label: Option<String>,
    #[serde(default)]
    default_text: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    position: Option<HfPosition>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    style: Option<StyleDef>,
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
struct HeaderFooterDefinition {
    #[serde(default)]
    header_fields: Vec<HeaderFooterField>,
    #[serde(default)]
    footer_fields: Vec<HeaderFooterField>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Mall {
    id: String,
    name: String,
    #[serde(default)]
    description: String,
    #[serde(default)]
    category_id: Option<Value>,
    #[serde(default)]
    org_scope: Option<Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    default_style: Option<StyleDef>,
    #[serde(default)]
    header_footer: HeaderFooterDefinition,
    #[serde(default)]
    parameters: Vec<ParameterDef>,
    #[serde(default)]
    blocks: Vec<ContentBlock>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct UsedBlock {
    instance_id: String,
    block_id: String,
    source: String,
    order: i64,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct DocumentSession {
    id: String,
    template_id: String,
    template_name: String,
    organisation_id: String,
    parameter_values: Map<String, Value>,
    used_blocks: Vec<UsedBlock>,
    user_content: Map<String, Value>,
    header_footer_values: Map<String, Value>,
    created_at: String,
    updated_at: String,
}

// ---------------------------------------------------------------------------
// Motorns tillstånd
// ---------------------------------------------------------------------------

const HISTORY_LIMIT: usize = 100;

#[derive(Default)]
struct Engine {
    organisations: Vec<Organisation>,
    mall: Option<Mall>,
    session: Option<DocumentSession>,
    history: Vec<DocumentSession>,
    future: Vec<DocumentSession>,
    id_seed: u64,
    id_counter: u64,
}

thread_local! {
    static ENGINE: RefCell<Engine> = RefCell::new(Engine::default());
}

impl Engine {
    fn new_id(&mut self, prefix: &str) -> String {
        self.id_counter += 1;
        format!("{}-{:x}-{}", prefix, self.id_seed, self.id_counter)
    }

    fn commit(&mut self) {
        if let Some(s) = &self.session {
            self.history.push(s.clone());
            if self.history.len() > HISTORY_LIMIT {
                self.history.remove(0);
            }
            self.future.clear();
        }
    }
}

// ---------------------------------------------------------------------------
// Parameterlogik
// ---------------------------------------------------------------------------

fn flatten<'a>(defs: &'a [ParameterDef], out: &mut Vec<&'a ParameterDef>) {
    for d in defs {
        out.push(d);
        if let Some(children) = &d.children {
            flatten(children, out);
        }
    }
}

/// Beräknar synlighet för varje parameter: ett barn syns bara när
/// förälderns aktuella värde matchar `showWhen` (rekursivt uppåt).
fn visibility(defs: &[ParameterDef], values: &Map<String, Value>) -> Map<String, Value> {
    let mut vis = Map::new();
    fn walk(
        defs: &[ParameterDef],
        values: &Map<String, Value>,
        parent_visible: bool,
        vis: &mut Map<String, Value>,
    ) {
        for d in defs {
            let visible = parent_visible;
            vis.insert(d.id.clone(), Value::Bool(visible));
            if let Some(children) = &d.children {
                for c in children {
                    let child_visible = visible
                        && match &c.show_when {
                            None => true,
                            Some(cond) => values.get(&d.id).map(|v| v == cond).unwrap_or(false),
                        };
                    vis.insert(c.id.clone(), Value::Bool(child_visible));
                    if let Some(gc) = &c.children {
                        walk_children(gc, c, values, child_visible, vis);
                    }
                }
            }
        }
    }
    fn walk_children(
        defs: &[ParameterDef],
        parent: &ParameterDef,
        values: &Map<String, Value>,
        parent_visible: bool,
        vis: &mut Map<String, Value>,
    ) {
        for d in defs {
            let visible = parent_visible
                && match &d.show_when {
                    None => true,
                    Some(cond) => values.get(&parent.id).map(|v| v == cond).unwrap_or(false),
                };
            vis.insert(d.id.clone(), Value::Bool(visible));
            if let Some(children) = &d.children {
                walk_children(children, d, values, visible, vis);
            }
        }
    }
    walk(defs, values, true, &mut vis);
    vis
}

fn escape_html(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    for c in text.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#39;"),
            _ => out.push(c),
        }
    }
    out
}

fn escape_attr(text: &str) -> String {
    escape_html(text)
}

/// Formaterar ett parametervärde för visning (Ja/Nej, listetiketter, datum).
fn format_value(def: Option<&ParameterDef>, value: Option<&Value>) -> String {
    let v = match value {
        None | Some(Value::Null) => return String::new(),
        Some(v) => v,
    };
    let def = match def {
        None => return value_to_plain(v),
        Some(d) => d,
    };
    match def.ptype.as_str() {
        "boolean" => match v {
            Value::Bool(true) => "Ja".into(),
            Value::Bool(false) => "Nej".into(),
            other => value_to_plain(other),
        },
        "list" => {
            let raw = value_to_plain(v);
            if let Some(opts) = &def.options {
                if let Some(o) = opts.iter().find(|o| o.value == raw) {
                    return o.label.clone();
                }
            }
            raw
        }
        _ => value_to_plain(v),
    }
}

fn value_to_plain(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Null => String::new(),
        other => other.to_string(),
    }
}

/// Ersätter {{parameterId}} med Word-liknande innehållskontroller (inline-fält).
fn substitute_placeholders(
    content: &str,
    defs: &[&ParameterDef],
    values: &Map<String, Value>,
    vis: &Map<String, Value>,
) -> String {
    let mut out = String::with_capacity(content.len() + 64);
    let bytes = content.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'{' && i + 1 < bytes.len() && bytes[i + 1] == b'{' {
            if let Some(end) = content[i + 2..].find("}}") {
                let id = content[i + 2..i + 2 + end].trim();
                if !id.is_empty() && id.chars().all(|c| c.is_alphanumeric() || "._-".contains(c)) {
                    let def = defs.iter().find(|d| d.id == id).copied();
                    let text = format_value(def, values.get(id));
                    let label = def.map(|d| d.label.as_str()).unwrap_or(id);
                    let ptype = def.map(|d| d.ptype.as_str()).unwrap_or("text");
                    let hidden = !matches!(vis.get(id), Some(Value::Bool(true)) | None);
                    out.push_str(&format!(
                        "<span class=\"fred-cc{}\" data-param-id=\"{}\" data-type=\"{}\" data-ph=\"{}\" contenteditable=\"false\">{}</span>",
                        if hidden { " fred-cc-hidden" } else { "" },
                        escape_attr(id),
                        escape_attr(ptype),
                        escape_attr(label),
                        escape_html(&text)
                    ));
                    i += 2 + end + 2;
                    continue;
                }
            }
        }
        // kopiera nästa tecken (utf8-säkert)
        let ch_len = utf8_len(bytes[i]);
        out.push_str(&content[i..i + ch_len]);
        i += ch_len;
    }
    out
}

fn utf8_len(b: u8) -> usize {
    if b < 0x80 {
        1
    } else if b >> 5 == 0b110 {
        2
    } else if b >> 4 == 0b1110 {
        3
    } else {
        4
    }
}

// ---------------------------------------------------------------------------
// Sök & ersätt i lagrad HTML (utanför taggar och utanför inline-fält)
// ---------------------------------------------------------------------------

fn replace_in_html(html: &str, search: &str, replace: &str, count: &mut usize) -> String {
    if search.is_empty() {
        return html.to_string();
    }
    let mut out = String::with_capacity(html.len());
    let mut text_buf = String::new();
    let mut chars = html.char_indices().peekable();
    let mut cc_depth = 0usize; // inne i fred-cc-fält

    let flush = |buf: &mut String, out: &mut String, count: &mut usize, protect: bool| {
        if buf.is_empty() {
            return;
        }
        if protect {
            out.push_str(buf);
        } else {
            let lower_buf = buf.to_lowercase();
            let lower_search = search.to_lowercase();
            let mut pos = 0;
            while let Some(found) = lower_buf[pos..].find(&lower_search) {
                let start = pos + found;
                // hitta byte-gräns i originalsträngen: lowercase kan ändra längd
                // för vissa tecken; för svenska/latinska texter är längden stabil,
                // men fall tillbaka till exakt sökning om något inte stämmer.
                if buf.is_char_boundary(start) && start + search.len() <= buf.len() {
                    out.push_str(&buf[pos..start]);
                    out.push_str(replace);
                    *count += 1;
                    pos = start + search.len();
                } else {
                    break;
                }
            }
            out.push_str(&buf[pos..]);
        }
        buf.clear();
    };

    while let Some((i, c)) = chars.next() {
        if c == '<' {
            flush(&mut text_buf, &mut out, count, cc_depth > 0);
            // läs hela taggen
            let rest = &html[i..];
            let tag_end = rest.find('>').map(|e| i + e + 1).unwrap_or(html.len());
            let tag = &html[i..tag_end];
            if tag.contains("data-param-id=") {
                cc_depth += 1;
            } else if cc_depth > 0 && tag.starts_with("</span") {
                cc_depth -= 1;
            }
            out.push_str(tag);
            while let Some(&(j, _)) = chars.peek() {
                if j < tag_end {
                    chars.next();
                } else {
                    break;
                }
            }
        } else {
            text_buf.push(c);
        }
    }
    flush(&mut text_buf, &mut out, count, cc_depth > 0);
    out
}

// ---------------------------------------------------------------------------
// Session och rendering
// ---------------------------------------------------------------------------

fn default_values(defs: &[ParameterDef]) -> Map<String, Value> {
    let mut flat = Vec::new();
    flatten(defs, &mut flat);
    let mut values = Map::new();
    for d in flat {
        let v = d.default_value.clone().unwrap_or(if d.ptype == "boolean" {
            Value::Bool(false)
        } else {
            Value::Null
        });
        values.insert(d.id.clone(), v);
    }
    values
}

fn build_session(engine: &mut Engine, mall: &Mall, organisation_id: &str, now: &str) -> DocumentSession {
    let mut values = default_values(&mall.parameters);
    let vis = visibility(&mall.parameters, &values);
    let mut flat = Vec::new();
    flatten(&mall.parameters, &mut flat);

    let mut fixed: Vec<&ContentBlock> = mall.blocks.iter().filter(|b| b.placement == "fixed").collect();
    fixed.sort_by_key(|b| b.order);

    let mut user_content = Map::new();
    let mut used_blocks = Vec::new();
    for (i, block) in fixed.iter().enumerate() {
        let instance_id = engine.new_id("instance");
        if block.btype == "editable" {
            let html = substitute_placeholders(&block.content, &flat, &values, &vis);
            user_content.insert(instance_id.clone(), Value::String(html));
        }
        used_blocks.push(UsedBlock {
            instance_id,
            block_id: block.id.clone(),
            source: "fixed".into(),
            order: i as i64,
        });
    }

    let mut hf_values = Map::new();
    for f in mall
        .header_footer
        .header_fields
        .iter()
        .chain(mall.header_footer.footer_fields.iter())
    {
        if f.kind == "text" {
            hf_values.insert(
                f.id.clone(),
                Value::String(f.default_text.clone().unwrap_or_default()),
            );
        }
    }

    // Booleans utan default ska vara false, övriga null – redan hanterat.
    if values.is_empty() {
        values = Map::new();
    }

    DocumentSession {
        id: engine.new_id("doc"),
        template_id: mall.id.clone(),
        template_name: mall.name.clone(),
        organisation_id: organisation_id.to_string(),
        parameter_values: values,
        used_blocks,
        user_content,
        header_footer_values: hf_values,
        created_at: now.to_string(),
        updated_at: now.to_string(),
    }
}

/// Konverterar en Stildefinition till inline-CSS (kravspec 6.0). Utelämnade
/// attribut ger ingen CSS och ärver därmed från nivån ovanför.
fn style_to_css(style: Option<&StyleDef>) -> String {
    let mut css = String::new();
    let Some(s) = style else {
        return css;
    };
    if let Some(f) = &s.font_family {
        css.push_str("font-family:");
        css.push_str(f);
        css.push(';');
    }
    if let Some(pt) = s.font_size_pt {
        css.push_str(&format!("font-size:{}pt;", pt));
    }
    if let Some(b) = s.bold {
        css.push_str(if b { "font-weight:bold;" } else { "font-weight:normal;" });
    }
    if let Some(i) = s.italic {
        css.push_str(if i { "font-style:italic;" } else { "font-style:normal;" });
    }
    if let Some(u) = s.underline {
        css.push_str(if u { "text-decoration:underline;" } else { "text-decoration:none;" });
    }
    css
}

/// Bygger hela rendermodellen som JS-skalet ritar upp.
fn render_model(engine: &Engine) -> Value {
    let (mall, session) = match (&engine.mall, &engine.session) {
        (Some(m), Some(s)) => (m, s),
        _ => return json!({ "ok": false, "error": "Ingen aktiv session" }),
    };
    let mut flat = Vec::new();
    flatten(&mall.parameters, &mut flat);
    let vis = visibility(&mall.parameters, &session.parameter_values);

    let org = engine
        .organisations
        .iter()
        .find(|o| o.id == session.organisation_id)
        .cloned()
        .unwrap_or_default();

    let mut used: Vec<&UsedBlock> = session.used_blocks.iter().collect();
    used.sort_by_key(|b| b.order);

    let blocks: Vec<Value> = used
        .iter()
        .filter_map(|ub| {
            let block = mall.blocks.iter().find(|b| b.id == ub.block_id)?;
            // Villkor mellan block (kravspec V13): blocket ligger kvar i
            // sessionen men döljs så länge villkoret inte är uppfyllt.
            if !block_visible(block, &session.parameter_values) {
                return None;
            }
            let editable = block.btype == "editable";
            let html = if editable {
                session
                    .user_content
                    .get(&ub.instance_id)
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
                    .unwrap_or_default()
            } else {
                substitute_placeholders(&block.content, &flat, &session.parameter_values, &vis)
            };
            Some(json!({
                "instanceId": ub.instance_id,
                "blockId": ub.block_id,
                "title": block.title,
                "blockType": block.btype,
                "source": ub.source,
                "editable": editable,
                "html": html,
                "styleCss": style_to_css(block.style.as_ref()),
            }))
        })
        .collect();

    let hf_field = |f: &HeaderFooterField| -> Value {
        // Fält utan position hamnar i vänster/mitt (kravspec 2.1).
        let col = f.position.as_ref().map(|p| p.col.as_str()).unwrap_or("left");
        let row = f.position.as_ref().map(|p| p.row.as_str()).unwrap_or("middle");
        let style_css = style_to_css(f.style.as_ref());
        match f.kind.as_str() {
            "logo" => json!({ "id": f.id, "kind": "logo", "logo": org.logo_data_url, "col": col, "row": row, "styleCss": style_css }),
            "organisation" => json!({ "id": f.id, "kind": "organisation", "text": org.name, "col": col, "row": row, "styleCss": style_css }),
            _ => json!({
                "id": f.id,
                "kind": "text",
                "label": f.label,
                "text": session.header_footer_values.get(&f.id).and_then(|v| v.as_str()).unwrap_or(""),
                "col": col,
                "row": row,
                "styleCss": style_css,
            }),
        }
    };

    let params: Vec<Value> = flat
        .iter()
        .map(|d| {
            json!({
                "id": d.id,
                "label": d.label,
                "type": d.ptype,
                "options": d.options,
                "value": session.parameter_values.get(&d.id).cloned().unwrap_or(Value::Null),
                "display": format_value(Some(d), session.parameter_values.get(&d.id)),
                "visible": vis.get(&d.id).cloned().unwrap_or(Value::Bool(true)),
            })
        })
        .collect();

    // Fraser vars villkor inte är uppfyllt går inte att infoga (kravspec V13).
    let mut free: Vec<&ContentBlock> = mall
        .blocks
        .iter()
        .filter(|b| b.placement == "free" && block_visible(b, &session.parameter_values))
        .collect();
    free.sort_by_key(|b| b.order);
    let free_phrases: Vec<Value> = free
        .iter()
        .map(|b| {
            let preview: String = strip_tags(&b.content).chars().take(120).collect();
            json!({ "blockId": b.id, "title": b.title, "type": b.btype, "preview": preview })
        })
        .collect();

    json!({
        "ok": true,
        "doc": {
            "sessionId": session.id,
            "templateName": session.template_name,
            "organisation": org,
            "defaultStyleCss": style_to_css(mall.default_style.as_ref()),
            "blocks": blocks,
            "header": mall.header_footer.header_fields.iter().map(hf_field).collect::<Vec<_>>(),
            "footer": mall.header_footer.footer_fields.iter().map(hf_field).collect::<Vec<_>>(),
            "params": params,
            "freePhrases": free_phrases,
            "canUndo": !engine.history.is_empty(),
            "canRedo": !engine.future.is_empty(),
            "updatedAt": session.updated_at,
        }
    })
}

fn strip_tags(html: &str) -> String {
    let mut out = String::new();
    let mut in_tag = false;
    for c in html.chars() {
        match c {
            '<' => in_tag = true,
            '>' => in_tag = false,
            _ if !in_tag => out.push(c),
            _ => {}
        }
    }
    out.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&nbsp;", " ")
}

// ---------------------------------------------------------------------------
// Kommandohantering
// ---------------------------------------------------------------------------

fn get_str<'a>(req: &'a Value, key: &str) -> Option<&'a str> {
    req.get(key).and_then(|v| v.as_str())
}

fn touch(session: &mut DocumentSession, req: &Value) {
    if let Some(now) = get_str(req, "now") {
        session.updated_at = now.to_string();
    }
}

fn handle(req: Value) -> Value {
    let cmd = match get_str(&req, "cmd") {
        Some(c) => c.to_string(),
        None => return json!({ "ok": false, "error": "cmd saknas" }),
    };

    ENGINE.with(|cell| {
        let mut engine = cell.borrow_mut();
        match cmd.as_str() {
            "ping" => json!({ "ok": true, "engine": "fred-engine", "version": env!("CARGO_PKG_VERSION") }),

            "load_organisations" => {
                match serde_json::from_value::<Vec<Organisation>>(req.get("organisations").cloned().unwrap_or(Value::Null)) {
                    Ok(orgs) => {
                        engine.organisations = orgs;
                        json!({ "ok": true })
                    }
                    Err(e) => json!({ "ok": false, "error": format!("Ogiltig organisationslista: {e}") }),
                }
            }

            "new_session" => {
                let mall: Mall = match serde_json::from_value(req.get("mall").cloned().unwrap_or(Value::Null)) {
                    Ok(m) => m,
                    Err(e) => return json!({ "ok": false, "error": format!("Ogiltig mall: {e}") }),
                };
                let org_id = get_str(&req, "organisationId").unwrap_or("").to_string();
                let now = get_str(&req, "now").unwrap_or("").to_string();
                engine.id_seed = req.get("seed").and_then(|v| v.as_u64()).unwrap_or(1);
                engine.id_counter = 0;
                let mut session = build_session(&mut engine, &mall, &org_id, &now);
                // Initialvärden från extern applikation (kravspec avsnitt 4).
                if let Some(Value::Object(init)) = req.get("values") {
                    for (k, v) in init {
                        session.parameter_values.insert(k.clone(), v.clone());
                    }
                }
                engine.mall = Some(mall);
                engine.session = Some(session);
                engine.history.clear();
                engine.future.clear();
                render_model(&engine)
            }

            "open_session" => {
                let mall: Mall = match serde_json::from_value(req.get("mall").cloned().unwrap_or(Value::Null)) {
                    Ok(m) => m,
                    Err(e) => return json!({ "ok": false, "error": format!("Ogiltig mall: {e}") }),
                };
                let session: DocumentSession = match serde_json::from_value(req.get("session").cloned().unwrap_or(Value::Null)) {
                    Ok(s) => s,
                    Err(e) => return json!({ "ok": false, "error": format!("Ogiltig sessionsfil: {e}") }),
                };
                if session.template_id != mall.id {
                    return json!({ "ok": false, "error": "Sessionen hör till en annan mall" });
                }
                engine.id_seed = req.get("seed").and_then(|v| v.as_u64()).unwrap_or(1);
                engine.id_counter = 0;
                engine.mall = Some(mall);
                engine.session = Some(session);
                engine.history.clear();
                engine.future.clear();
                render_model(&engine)
            }

            "save_session" => match &engine.session {
                Some(s) => json!({ "ok": true, "file": { "marker": "fred-session", "version": 1, "session": s } }),
                None => json!({ "ok": false, "error": "Ingen aktiv session" }),
            },

            "commit" => {
                engine.commit();
                json!({ "ok": true })
            }

            "set_param" | "set_param_live" => {
                let id = match get_str(&req, "id") {
                    Some(i) => i.to_string(),
                    None => return json!({ "ok": false, "error": "id saknas" }),
                };
                let value = req.get("value").cloned().unwrap_or(Value::Null);
                if cmd == "set_param" {
                    engine.commit();
                }
                let Some(session) = engine.session.as_mut() else {
                    return json!({ "ok": false, "error": "Ingen aktiv session" });
                };
                session.parameter_values.insert(id, value);
                touch(session, &req);
                render_model(&engine)
            }

            "set_user_content" => {
                let (Some(instance_id), Some(html)) = (get_str(&req, "instanceId"), get_str(&req, "html")) else {
                    return json!({ "ok": false, "error": "instanceId/html saknas" });
                };
                let (instance_id, html) = (instance_id.to_string(), html.to_string());
                let Some(session) = engine.session.as_mut() else {
                    return json!({ "ok": false, "error": "Ingen aktiv session" });
                };
                session.user_content.insert(instance_id, Value::String(html));
                touch(session, &req);
                json!({ "ok": true })
            }

            "set_header_footer" => {
                let (Some(field_id), Some(value)) = (get_str(&req, "fieldId"), get_str(&req, "value")) else {
                    return json!({ "ok": false, "error": "fieldId/value saknas" });
                };
                let (field_id, value) = (field_id.to_string(), value.to_string());
                let Some(session) = engine.session.as_mut() else {
                    return json!({ "ok": false, "error": "Ingen aktiv session" });
                };
                session.header_footer_values.insert(field_id, Value::String(value));
                touch(session, &req);
                json!({ "ok": true })
            }

            "insert_free_block" => {
                let Some(block_id) = get_str(&req, "blockId").map(|s| s.to_string()) else {
                    return json!({ "ok": false, "error": "blockId saknas" });
                };
                let after = get_str(&req, "afterInstanceId").map(|s| s.to_string());
                let Some(mall) = engine.mall.clone() else {
                    return json!({ "ok": false, "error": "Ingen mall laddad" });
                };
                let Some(block) = mall.blocks.iter().find(|b| b.id == block_id).cloned() else {
                    return json!({ "ok": false, "error": "Blocket finns inte i mallen" });
                };
                if let Some(s) = engine.session.as_ref() {
                    if !block_visible(&block, &s.parameter_values) {
                        return json!({ "ok": false, "error": "Frasens synlighetsvillkor är inte uppfyllt" });
                    }
                }
                engine.commit();
                let instance_id = engine.new_id("instance");
                let mut flat = Vec::new();
                flatten(&mall.parameters, &mut flat);
                let Some(session) = engine.session.as_mut() else {
                    return json!({ "ok": false, "error": "Ingen aktiv session" });
                };
                let vis = visibility(&mall.parameters, &session.parameter_values);
                if block.btype == "editable" {
                    let html = substitute_placeholders(&block.content, &flat, &session.parameter_values, &vis);
                    session.user_content.insert(instance_id.clone(), Value::String(html));
                }
                // Placera efter angivet block, annars sist.
                let mut sorted: Vec<UsedBlock> = session.used_blocks.clone();
                sorted.sort_by_key(|b| b.order);
                let insert_at = after
                    .and_then(|a| sorted.iter().position(|b| b.instance_id == a).map(|p| p + 1))
                    .unwrap_or(sorted.len());
                sorted.insert(
                    insert_at,
                    UsedBlock {
                        instance_id: instance_id.clone(),
                        block_id,
                        source: "free".into(),
                        order: 0,
                    },
                );
                for (i, b) in sorted.iter_mut().enumerate() {
                    b.order = i as i64;
                }
                session.used_blocks = sorted;
                touch(session, &req);
                let mut model = render_model(&engine);
                if let Some(obj) = model.as_object_mut() {
                    obj.insert("insertedInstanceId".into(), Value::String(instance_id));
                }
                model
            }

            "remove_block" => {
                let Some(instance_id) = get_str(&req, "instanceId").map(|s| s.to_string()) else {
                    return json!({ "ok": false, "error": "instanceId saknas" });
                };
                engine.commit();
                let Some(session) = engine.session.as_mut() else {
                    return json!({ "ok": false, "error": "Ingen aktiv session" });
                };
                session.used_blocks.retain(|b| b.instance_id != instance_id);
                session.user_content.remove(&instance_id);
                touch(session, &req);
                render_model(&engine)
            }

            "move_block" => {
                let Some(instance_id) = get_str(&req, "instanceId").map(|s| s.to_string()) else {
                    return json!({ "ok": false, "error": "instanceId saknas" });
                };
                let dir = req.get("dir").and_then(|v| v.as_i64()).unwrap_or(0);
                engine.commit();
                let Some(session) = engine.session.as_mut() else {
                    return json!({ "ok": false, "error": "Ingen aktiv session" });
                };
                let mut sorted: Vec<UsedBlock> = session.used_blocks.clone();
                sorted.sort_by_key(|b| b.order);
                if let Some(idx) = sorted.iter().position(|b| b.instance_id == instance_id) {
                    let target = idx as i64 + dir;
                    if target >= 0 && (target as usize) < sorted.len() {
                        sorted.swap(idx, target as usize);
                    }
                }
                for (i, b) in sorted.iter_mut().enumerate() {
                    b.order = i as i64;
                }
                session.used_blocks = sorted;
                touch(session, &req);
                render_model(&engine)
            }

            "replace_all" => {
                let (Some(search), Some(replace)) = (get_str(&req, "search"), get_str(&req, "replace")) else {
                    return json!({ "ok": false, "error": "search/replace saknas" });
                };
                let (search, replace) = (search.to_string(), escape_html(replace));
                engine.commit();
                let Some(session) = engine.session.as_mut() else {
                    return json!({ "ok": false, "error": "Ingen aktiv session" });
                };
                let mut count = 0usize;
                let keys: Vec<String> = session.user_content.keys().cloned().collect();
                for key in keys {
                    if let Some(Value::String(html)) = session.user_content.get(&key) {
                        let updated = replace_in_html(html, &search, &replace, &mut count);
                        session.user_content.insert(key, Value::String(updated));
                    }
                }
                touch(session, &req);
                let mut model = render_model(&engine);
                if let Some(obj) = model.as_object_mut() {
                    obj.insert("replacedCount".into(), Value::Number(count.into()));
                }
                model
            }

            "undo" => {
                if let Some(prev) = engine.history.pop() {
                    if let Some(current) = engine.session.take() {
                        engine.future.insert(0, current);
                        if engine.future.len() > HISTORY_LIMIT {
                            engine.future.pop();
                        }
                    }
                    engine.session = Some(prev);
                }
                render_model(&engine)
            }

            "redo" => {
                if !engine.future.is_empty() {
                    let next = engine.future.remove(0);
                    if let Some(current) = engine.session.take() {
                        engine.history.push(current);
                    }
                    engine.session = Some(next);
                }
                render_model(&engine)
            }

            "render" => render_model(&engine),

            other => json!({ "ok": false, "error": format!("Okänt kommando: {other}") }),
        }
    })
}

// ---------------------------------------------------------------------------
// WASM ABI
// ---------------------------------------------------------------------------

#[no_mangle]
pub extern "C" fn fred_alloc(len: usize) -> *mut u8 {
    let mut buf = Vec::<u8>::with_capacity(len.max(1));
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

#[no_mangle]
/// # Safety
/// `ptr` måste komma från `fred_alloc`/`fred_cmd` med samma `len`.
pub unsafe extern "C" fn fred_free(ptr: *mut u8, len: usize) {
    if !ptr.is_null() {
        drop(Vec::from_raw_parts(ptr, 0, len.max(1)));
    }
}

#[no_mangle]
/// # Safety
/// `ptr`/`len` måste peka på en giltig UTF-8-buffert allokerad via `fred_alloc`.
pub unsafe extern "C" fn fred_cmd(ptr: *const u8, len: usize) -> *mut u8 {
    let input = std::slice::from_raw_parts(ptr, len);
    let response = match std::str::from_utf8(input)
        .map_err(|e| e.to_string())
        .and_then(|s| serde_json::from_str::<Value>(s).map_err(|e| e.to_string()))
    {
        Ok(req) => handle(req),
        Err(e) => json!({ "ok": false, "error": format!("Ogiltig request: {e}") }),
    };
    let json = serde_json::to_string(&response).unwrap_or_else(|_| "{\"ok\":false}".into());
    let bytes = json.as_bytes();
    let total = 4 + bytes.len();
    let out = fred_alloc(total);
    let out_slice = std::slice::from_raw_parts_mut(out, total);
    out_slice[..4].copy_from_slice(&(bytes.len() as u32).to_le_bytes());
    out_slice[4..].copy_from_slice(bytes);
    out
}
