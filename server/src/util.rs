//use simplelog::*;
//use std::fs::File;
//use std::fs::OpenOptions;

// url::form_urlencoded::parse()
//
/*
pub fn logger_init (log_file: &str) {
	CombinedLogger::init(
	    vec![
			TermLogger::new(LevelFilter::Debug, Config::default()).unwrap(),
			WriteLogger::new(LevelFilter::Debug, Config::default(),
			    OpenOptions::new()
				//.read(true)
				//.write(true)
				.append(true)
				.create(true)
				.open(log_file).unwrap()
				//File::create("my_rust_binary.log").unwrap()
			),
		]
	).unwrap();
}
*/
