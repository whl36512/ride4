extern crate serde_json;
extern crate server;
extern crate env_logger;

//use server::util ;
use server::router_util ;
//use server::constants::LOG_FILE ;

fn main() {
    //util::logger_init(LOG_FILE);
	env_logger::init();
    router_util::router_start(4201);
}

