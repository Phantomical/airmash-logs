
extern crate statslib;

use statslib::*;

use std::io::{BufReader, BufRead};
use std::fs::File;
use std::env::args;
use std::vec::Vec;
use std::collections::HashMap;

const ANON_NAME: &'static str = "ANON_PLAYER";
const ANON_ID  : i64          = -1;

fn main() {
	let args: Vec<String> = args().collect();

	if args.len() < 2 {
		println!("Usage: chatlog <logfile>");
	}

	let file = File::open(args[1].clone()).unwrap();

	let mut anon_users: HashMap<i64, ()> = HashMap::new();

	for line in BufReader::new(file).lines() {
		let ln = line.unwrap();
		let result = parse(&ln);

		if result.is_err() {
			//println!("{}", result.unwrap_err().message);
			continue;
		}
		let record = result.unwrap();

		if record.tag == "ANONYMISE" {
			let id = match record.entries["id"] {
				RecordValue::Int(val) => val,
				_ => panic!("id was not an int")
			};

			anon_users.insert(id, ());
		}
	}
	
	let file = File::open(args[1].clone()).unwrap();
	for line in BufReader::new(file).lines() {
		let ln = line.unwrap();
		let result = parse(&ln);

		if result.is_err() {
			//println!("{}", result.unwrap_err().message);
			continue;
		}
		let mut record = result.unwrap();

		if record.entries.contains_key("id") {
			let id = match record.entries["id"] {
				RecordValue::Int(val) => val,
				_ => panic!("id was not an int")
			};

			if anon_users.contains_key(&id) {
				record.entries.insert("id", RecordValue::Int(ANON_ID));

				if record.tag == "PLAYER_NEW" {
					record.entries.insert("name", RecordValue::Str(ANON_NAME));
				}

				if record.tag == "PLAYER_UPDATE" { continue; }
				if record.tag == "ANONYMISE" { continue; }
			}
		}

		println!("{}", write_record(&record));
	}
}