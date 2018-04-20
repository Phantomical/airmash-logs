
extern crate statslib;

use statslib::*;

use std::io::{BufReader, BufRead};
use std::fs::File;
use std::env::args;

fn main() {
	let args: Vec<String> = args().collect();

	if args.len() < 3 {
		println!("Usage: chatlog <type> <logfile>");
	}

	let file = File::open(args[2].clone()).unwrap();
	let messagetype = args[1].clone();	

	for line in BufReader::new(file).lines() {
		let ln = line.unwrap();
		let result = parse(&ln);

		if result.is_err() {
			//println!("{}", result.unwrap_err().message);
			continue;
		}
		let mut record = result.unwrap();

		if record.tag == messagetype {
			println!("{}", write_record(&record));
		}
	}
}