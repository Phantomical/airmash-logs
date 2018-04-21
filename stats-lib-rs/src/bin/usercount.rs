
extern crate statslib;
extern crate chrono;

use statslib::*;
use chrono::prelude::*;
use chrono::{Duration};

use std::io::{BufReader, BufRead};
use std::fs::File;
use std::env::args;



fn main() {
	let args: Vec<String> = args().collect();

	if args.len() < 3 {
		println!("Usage: usercount <duration> <logfile>");
	}

	let file = File::open(args[2].clone()).unwrap();
	let samplegap = Duration::minutes(args[1].clone().parse().unwrap());
	// Doesn't matter what this is set to, it will be overwritten
	let mut startdate = Utc::now();
	let mut numplayers = 0;
	let mut maxplayers = 0;
	let mut is_first = true;

	for line in BufReader::new(file).lines() {
		let ln = line.unwrap();
		let result = parse(&ln);

		if result.is_err() {
			//println!("{}", result.unwrap_err().message);
			continue;
		}
		let mut record = result.unwrap();

		let timestamp = match record.entries["time"] {
			RecordValue::Str(timestr) => str_to_datetime(timestr),
			_ => panic!()
		}.unwrap();

		// Initialize startdate to the first timestamp
		if is_first {
			startdate = timestamp;
			is_first = false;
		}

		while timestamp - startdate > samplegap {
			println!("{}", maxplayers);
			maxplayers = numplayers;
			startdate = startdate + samplegap;
		}

		if record.tag == "PLAYER_NEW" {
			numplayers += 1;
			maxplayers = u32::max(maxplayers, numplayers);
		}
		else if record.tag == "PLAYER_LEAVE" {
			numplayers -= 1;
		}
		else if record.tag == "LOGIN" {
			numplayers = 0;
		}
	}
}