
use chrono::prelude::*;

use std::vec::Vec;

pub fn str_to_datetime(datestr: &str) -> Option<DateTime<Utc>> {
	let vals = datestr
		.split(":")
		.map(|x| x.parse::<u32>())
		.collect::<Vec<_>>();

	if vals.len() != 7 {
		return None;
	}

	for elem in vals.iter() {
		if elem.is_err() {
			return None;
		}
	}

	let vals = vals.into_iter().map(|x| x.unwrap()).collect::<Vec<_>>();

	return Some(Utc.ymd(
			vals[0] as i32,
			vals[1],
			vals[2])
		.and_hms_milli(
			vals[3],
			vals[4],
			vals[5],
			vals[6]));
}
