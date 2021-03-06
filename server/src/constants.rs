//pub static LOG_FILE : &str ="/tmp/server.log" ;
pub static EMPTY_STRING : &str ="" ;
pub static EMPTY_JSON_STRING : &str ="{}" ;

pub static SECRET	: &str ="an ultra secretstr" ;

pub static ERROR_ROW_NOT_FOUND: &str = r##"{"error":"row not found"}"## ;
pub static ERROR_NOT_SIGNED_IN: &str = r##"{"error":"not signed in"}"## ;
pub static ERROR_TRIP_VALIDATION: &str = r##"{"error":"trip validation failed"}"## ;

pub static PG_PORT 	: &str ="5432";
pub static PG_HOST 	: &str ="127.0.0.1" ;
//pub static PG_HOST 	: &str ="10.0.0.2" ;  // avoid ident login to postgres
//pub static PG_HOST 	: &str ="10.1.0.110" ;  // avoid ident login to postgres
pub static PG_USER 	: &str ="ride"    ;
pub static PG_PASSWD 	: &str ="ride" ;
pub static PG_DATABASE 	: &str ="ride" ;


pub static SQL_INS_TRIP 		: &str =  "select a	from funcs.ins_trip($1, $2) a " ;
pub static SQL_UPD_TRIP 		: &str =  "select a	from funcs.upd_trip($1, $2) a " ;
pub static SQL_GET_USER 		: &str =  "select a from funcs.get_usr($1, $2) a " ;
pub static SQL_GET_OTHER_USER	: &str =  "select a from funcs.get_other_usr($1, $2) a " ;
pub static SQL_UPD_USER 		: &str =  "select a from funcs.upd_usr($1, $2) a " ;
pub static SQL_SEARCH 			: &str =  "select a from funcs.search($1, $2) a " ;
//pub static SQL_SEARCH_ALL 	: &str =  "select a from funcs.search_all($1, $2) a " ;
//pub static SQL_SEARCH_REGION 	: &str =  "select a from funcs.search_region($1, $2) a " ;
pub static SQL_ACTIVITY 		: &str =  "select a from funcs.activity($1, $2) a " ;
pub static SQL_MYOFFER 			: &str =  "select a from funcs.myoffers($1, $2) a " ;
pub static SQL_BOOK 			: &str =  "select a from funcs.book($1, $2) a " ;
//pub static SQL_UPD_JOURNEY 	: &str =  "select a from funcs.upd_journey($1, $2) a " ;
pub static SQL_MYBOOKING		: &str =  "select a from funcs.mybooking($1, $2) a " ;
pub static SQL_DELETE			: &str =  "select a from funcs.delete($1, $2) a " ;
pub static SQL_CANCEL			: &str =  "select a from funcs.cancel($1, $2) a " ;
pub static SQL_FINISH			: &str =  "select a from funcs.finish($1, $2) a " ;
pub static SQL_CONFIRM			: &str =  "select a from funcs.confirm($1, $2) a " ;
//pub static SQL_REJECT			: &str =  "select a from funcs.reject($1, $2) a " ;
pub static SQL_MSGS				: &str =  "select a from funcs.msgs($1, $2) a " ;
pub static SQL_SAVE_MSG			: &str =  "select a from funcs.save_msg($1, $2) a " ;
pub static SQL_WITHDRAW			: &str =  "select a from funcs.withdraw($1, $2) a " ;
pub static SQL_THIST			: &str =  "select a from funcs.get_money_tran($1, $2) a " ;
pub static SQL_SAVE_REVIEW		: &str =  "select a from funcs.save_review($1, $2) a " ;
pub static SQL_GET_REVIEW		: &str =  "select a from funcs.get_review($1, $2) a " ;
pub static SQL_GET_REVIEWS		: &str =  "select a from funcs.get_reviews($1, $2) a " ;

pub static URL_WEBSOCKET_SERVER:   &str= "0.0.0.0:4202";


pub static CORS_ALLOWED_HOSTS : [&str; 14] 
	= [
			"http://rideshare.beegrove.com:4200"
		,	"http://rideshare.beegrove.com:4210"
		,	"https://rideshare.beegrove.com:4210"
		,	"http://rideshare.beegrove.com:4211"
		, 	"rideshare.beegrove.com:4200"
		,	"https://rideshare.beegrove.com"
		,	"http://rideshare.beegrove.com"
		, 	"http://10.1.0.110:4200"
		,	"10.1.0.110:4200"
		,	"10.1.0.110"
		,	"http://10.0.0.110:4200"
		,	"10.0.0.110:4200"
		,	"10.0.0.110"
		,	"https://ride.beegrove.com"
	] ;




