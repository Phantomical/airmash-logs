
use parser::{Record, RecordValue};

use std::vec::Vec;
use std::slice::*;

fn write_array<'a>(v: &Vec<RecordValue<'a>>) -> String {
	let string_list: Vec<String> = v.iter()
		.map(|x| write_value(x)).collect();

	return format!("[{}]", string_list.join(","));
}

fn write_value<'a>(v: &RecordValue<'a>) -> String {
	return match v {
		&RecordValue::Int(v) => v.to_string(),
		&RecordValue::Num(v) => v.to_string(),
		&RecordValue::Str(v) => format!("\"{}\"", v),
		&RecordValue::Array(ref arr) => write_array(arr)
	};
}

pub fn write_record<'a>(r: &Record<'a>) -> String {
	let mut values = vec![r.tag.to_string()];
	let mut entries = vec![];

	for (key, value) in r.entries.iter() {
		entries.push((key, format!("{}: {}", key.to_string(), write_value(value))));
	}

	entries.sort_by(|&(a, _), &(b, _)| a.cmp(b));

	for (_, val) in entries.into_iter() {
		values.push(val);
	}

	return format!("[{}]", values.join(", "));
}
