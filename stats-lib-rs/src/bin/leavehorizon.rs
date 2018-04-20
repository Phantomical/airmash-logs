
extern crate statslib;

use statslib::*;

use std::io::{BufReader, BufRead};
use std::fs::File;
use std::env::args;
use std::collections::HashMap;

fn main() {
	let args: Vec<String> = args().collect();

	if args.len() < 3 {
		println!("Usage: chatlog <type> <logfile>");
	}

	let file = File::open(args[2].clone()).unwrap();
	let messagetype = args[1].clone();
	let mut count = 0;
	
	let mut players: HashMap<i64, String> = HashMap::new();

	for line in BufReader::new(file).lines() {
		let ln = line.unwrap();
		let result = parse(&ln);

		if result.is_err() {
			//println!("{}", result.unwrap_err().message);
			continue;
		}
		let mut record = result.unwrap();

		if record.tag == "PLAYER_NEW" {
			let name = match record.entries["name"] {
				RecordValue::Str(val) => val,
				_ => panic!("name was not a string")
			};
			let id = match record.entries["id"] {
				RecordValue::Int(val) => val,
				_ => panic!("id was not an int")
			};

			players.insert(id, name.to_string());
		}

		if record.tag == "LEAVE_HORIZON" {
			let id = match record.entries["id"] {
				RecordValue::Int(val) => val,
				_ => panic!("id was not an int")
			};

			if players.contains_key(&id) {
				count += 1;
				record.entries.insert("name", RecordValue::Str(&players[&id]));

				record.entries.remove("time");
				record.entries.remove("id");

				println!("{}", write_record(&record));
			}
		}
	}

	println!("{}", count);
}