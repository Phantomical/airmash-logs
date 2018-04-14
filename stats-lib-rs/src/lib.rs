
extern crate regex;
#[macro_use]
extern crate lazy_static;

mod lexer;
mod parser;

pub use parser::{Record, RecordValue, ParseError, parse};
