
extern crate statslib;

use statslib::*;

use std::io::{BufReader, BufRead};
use std::fs::File;
use std::env::args;

fn main() {
	let args: Vec<String> = args().collect();

	if args.len() < 2 {
		println!("Usage: chatlog <logfile>");
	}

	let file = File::open(args[1].clone()).unwrap();

	for line in BufReader::new(file).lines() {
		let ln = line.unwrap();
		let result = parse(&ln);

		if result.is_err() {
			//println!("{}", result.unwrap_err().message);
			continue;
		}
		let record = result.unwrap();

		if record.tag == "PACKET" {
			println!("{}", ln);
		}
	}
}