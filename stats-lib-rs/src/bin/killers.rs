
extern crate statslib;

use statslib::*;

use std::io::{BufReader, BufRead};
use std::fs::File;
use std::env::args;
use std::vec::Vec;
use std::collections::HashMap;

fn main() {
	let args: Vec<String> = args().collect();

	if args.len() < 3 {
		println!("Usage: chatlog <logfile> <player>");
	}

	let file = File::open(args[1].clone()).unwrap();

	let mut players: HashMap<i64, String> = HashMap::new();
	let mut killers: HashMap<i64, u32> = HashMap::new();

	for line in BufReader::new(file).lines() {
		let ln = line.unwrap();
		let result = parse(&ln);

		if result.is_err() {
			//println!("{}", result.unwrap_err().message);
			continue;
		}
		let record = result.unwrap();

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
		else if record.tag == "PLAYER_KILL" {
			let id = match record.entries["id"] {
				RecordValue::Int(val) => val,
				_ => panic!("id was not an int")
			};
			let killer = match record.entries["killer"] {
				RecordValue::Int(val) => val,
				_ => panic!("killer was not an int")
			};
		
			// Player just went into spectate
			if killer == 0 {
				continue;
			}

			if players[&id] != args[2] {
				continue;
			}

			if killers.contains_key(&killer) {
				*killers.get_mut(&killer).unwrap() += 1;
			}
			else {
				killers.insert(killer, 1);
			}
		}
	}

	let mut names: HashMap<String, u32> = HashMap::new();

	for (killer, cnt) in killers.iter() {
		if !players.contains_key(&killer) {
			continue;
		}

		let name = &players[&killer];

		if names.contains_key(name) {
			*names.get_mut(name).unwrap() += cnt;
		}
		else {
			names.insert(name.to_string(), *cnt);
		}
	}

	let mut result: Vec<(String, u32)> = names.into_iter().collect();

	result.sort_by(|&(_, a), &(_, b)| a.cmp(&b));

	for (name, cnt) in result.into_iter() {
		println!("{}: {}", name, cnt);
	}
}