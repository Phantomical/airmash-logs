
extern crate statslib;

use statslib::*;

use std::io::{BufReader, BufRead};
use std::fs::File;
use std::env::args;
use std::collections::HashMap;

fn main() {
	let args: Vec<String> = args().collect();

	if args.len() < 3 {
		println!("Usage: filter <logfile> <types>...");
	}

	let file = File::open(args[1].clone()).unwrap();
	let mut messagetypes: HashMap<&str, ()> = HashMap::new();

	for msgtype in args[2..].iter() {
		messagetypes.insert(msgtype, ());
	}

	for line in BufReader::new(file).lines() {
		let ln = line.unwrap();
		let result = parse(&ln);

		if result.is_err() {
			//println!("{}", result.unwrap_err().message);
			continue;
		}
		let mut record = result.unwrap();

		if messagetypes.contains_key(record.tag) {
			println!("{}", write_record(&record));
		}
	}
}