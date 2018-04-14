
extern crate regex;
#[macro_use]
extern crate lazy_static;

mod lexer;
mod parser;
mod writer;

pub use parser::{Record, RecordValue, ParseError, parse};
pub use writer::write_record;
