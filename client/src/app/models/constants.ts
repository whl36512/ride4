export class Constants{
	static GET					= 'GET'				;
	static POST					= 'POST'			;

	static PROFILE				= "profile" 		;
	static JWT					= "jwt"				;
	//static SERVER_PORT			= "4210"			;
	//static SERVER_PORT			= "4201"			;

//	static GET_USER_URL 		= '/ws/get_user'	;
	static SAVE_USER_URL 		= '/ws/save_user'	;

	static URL_SAVE_USER 		= '/ws/save_user'	;
	static URL_GET_USER 		= '/ws/get_user'	;
	static URL_GET_OTHER_USER 	= '/ws/get_other_user'	;
	static URL_UPD_USER 		= '/ws/upd_user'	;
	static URL_INS_TRIP 		= '/ws/ins_trip'	;
	static URL_UPD_TRIP 		= '/ws/upd_trip'	;
	static URL_SEARCH 			= '/ws/search'	;
	static URL_SEARCH_ALL 		= '/ws/search_all'	;
	static URL_SEARCH_REGION 	= '/ws/search_region'	;
	static URL_BOOK 			= '/ws/book'		;
	static URL_ACTIVITY 		= '/ws/activity'	;
	static URL_MYOFFERS 		= '/ws/myoffers'	;
	static URL_MYBOOKING 		= '/ws/mybooking'	;
	static URL_DELETE 			= '/ws/delete'	;
	static URL_CANCEL		  	= '/ws/cancel'		; 
	static URL_FINISH 			= '/ws/finish'		; 
	static URL_CONFIRM 			= '/ws/confirm'		; 
	//static URL_REJECT 			= '/ws/reject'		; // reject or cancel by driver
	static URL_MSGS 			= '/ws/msgs'		; 
	static URL_SAVE_MSG 		= '/ws/save_msg'	; 
	static URL_WITHDRAW	 		= '/ws/withdraw'	; 
	static URL_THIST			= '/ws/thist'		; 
	static URL_SAVE_REVIEW		= '/ws/save_review'	; 
	static URL_GET_REVIEW		= '/ws/get_review'	; 
	static URL_GET_REVIEWS		= '/ws/get_reviews'	; 
	static URL_WEBS				= '/websocket'		; 
	static URL_ROUTING			= '//router.project-osrm.org/route/v1/driving/' 	;
	static URL_GEOCODE			= '//nominatim.openstreetmap.org/search/' 			;

	static URL_SERVER			= '//'+ window.location.host ; // port is included


	static URL_GOOGLE_MAP		= 'https://www.google.com/maps/dir' ;

	static USER_PAGE 			= 'user'			;
	static TRIP_PAGE 			= 'trip'			;
	static SEARCH_PAGE 			= 'search'			;

	static PAGE_USER			= 'user'			;
	static PAGE_TRIP			= 'trip'			;
	static PAGE_SEARCH			= 'search'			;
	static PAGE_ACTIVITY 		= 'activity'		;
	static PAGE_MYOFFERS 		= 'myoffers'		;
	static PAGE_TRIP_LIST 		= 'trip_list'		;
	static PAGE_BOOKING 		= 'booking'			;
	static PAGE_BOOKINGS 		= 'bookings'			;
	static PAGE_DEPOSIT			= 'deposit'			;
	static PAGE_WITHDRAW		= 'withdraw'		;
	static PAGE_CONTACT_US		= 'contact_us'		;
	static PAGE_TOU 			= 'tou'				;
	static PAGE_NAV 			= 'nav'				;
	static PAGE_MAP 			= 'map'				;
	static PAGE_THIST 			= 'thist'			;
	static PAGE_THIST_LIST 		= 'thist_list'		;
	static PAGE_FLASH 			= 'flash'			;
	static PAGE_MAP_CONTROLLER	= 'map_controller'	;
	static PAGE_CHAT			= 'chat'	;
	static PAGE_REVIEWS			= 'reviews'	;
	static PAGE_REVIEW			= 'review'	;

	static EMAIL_PATTERN 		
		= String.raw`^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-]{1,30}\.){1,4}([a-zA-Z]{2,5})$` ;

	static MAX_PRICE 			= 0.54 				;
	static MAX_PRICE_RIDER 		= Math.round(0.54* 1.2*100)/100.0 		;
	static MAX_SEATS 			= 6					;
	static MAX_TRIP_DAYS		= 180				; // can publish trips upto 30 days from today
	static MAX_SEARCH_TIGHTNESS = 5					;
	static BOOKING_FEE 			= 0.2				;
	static MIN_ACCOUNT_BALANCE 	= -10				;

	static FORM_DEBOUNCE_TIME 	= 500				;



	//static ERROR_NO_SESSION 	= {"error": "#201808181958 no session"} 	;
	//static ERROR_NOT_SIGNED_IN 	= {"error": "#201808181957 not signed in"} 	;
	static ERROR_NO_ROUTE 		= 0 					;
	static WARN_NOT_SIGNED_IN 	= 'Your are not signed in, yet'			;

	static KEY_FORM_SEARCH		= 'form_search'		;
	static KEY_FORM_TRIP		= 'form_trip'		;
	static KEY_MYOFFERS			= 'form_myoffers'	;
	static KEY_MYBOOKING		= 'form_mybooking'	;
	static KEY_FORM_ACTIVITY	= 'form_activity'	;
	static KEY_FORM_ACTIVITY_FILTER	= 'form_activity_filter'	;
	static KEY_FORM_THIST		= 'form_thist'		;
	static KEY_FORM_THIST_FILTER		= 'form_thist_filter'		;

	static VERSION_FORM_TRIP	= 3					;

	// timer is in miliseconds. So need * 1000 when set up timer
	static TIMER_INTERVAL		= 200				; //milisecond
	static MSG_TIMER_WAIT		= 5					; // seconds
	static MSG_NO_ACTIVITY_COUNT_DOWN	= 30		; // close msg window afer n seconds of no activity

	static ICON_RIGHT_DOUBLE_ARROW		= '\u21d2'			;
	static ICON_ARROW_UP		= '\ufe3f'			;
 	//static ICON_ARROW_DOWN		= &#xfe40		;
 	static ICON_ARROW_DOWN		= '\ufe40'			;
 	static ICON_STAR			= '&starf;'			;
 	static ICON_STAR_WHITE			= '&star;'			;
 	static ICON_FISHEYE			= '&#9673;'			;
 	static ICON_UPDOWN_ARROW	= '&nbsp; &#8645; &nbsp;'			;
 	//static ICON_UPDOWN_ARROW	= '&#8597;'			;
 	//static ICON_CHECK_MARK		= '&#2713;'			;
 	static ICON_CHECK_MARK		= '\u2713'			;


 	static EMAIL_DEPOSIT		= 'deposit@beegrove.com' ;

 	static ACTION_FAIL			= 'Action Failed' 	;
 	static OK_UPDATE			= 'Updated' 		;
 	static OK_NO_CHANGE			= 'No Change' 		;

 	static COLOR_RANDOM			= 'random' 			;
 	static COLOR_RANDOM_SAME	= 'random_same' 	;
 	static COLOR_RED			= 'red' 			;
 	static COLOR_GREEN			= 'green' 			;

 	static MSG_KEY_MSG_PANEL	= 'msgKeyMsgPanel' 	;
 	static MSG_KEY_TRIP			= 'msgKeyTrip' 		;
 	static MSG_KEY_PAIR			= 'msgKeyPair' 		;
 	static MSG_KEY_PAGE_OPEN	= 'msgKeyPageOpen' 	;
 	static MSG_KEY_PAGE_CLOSE	= 'msgKeyPageClose' ;
 	static MSG_KEY_MARKER_CLEAR	= 'msgKeyMarkerClear' 		; // clear all markers on the map
 	static MSG_KEY_MARKER_PAIR	= 'msgKeyMarkerPair' 		; // place marker pair on the map
 	static MSG_KEY_MARKER_BOOKS	= 'msgKeyMarkerBooks' 		; 
 	static MSG_KEY_MARKER_BOOK	= 'msgKeyMarkerBook' 		; 
 	static MSG_KEY_MARKER_FIT	= 'msgKeyMarkerFit' 		; // show map fitting the markers
 	static MSG_KEY_SHOW_ACTIVITY_BODY	= 'msgKeyShowActivityBody' 	; // show map fitting the markers
 	static MSG_KEY_MAP_BODY_SHOW	= 'msgKeyShowMapBodyShow' 		; 
 	static MSG_KEY_MAP_BODY_NOSHOW	= 'msgKeyShowMapBodyNoShow' 	; 
 	static MSG_KEY_MAP_LINE		= 'msgKeyMapLine' 	; 
 	static MSG_KEY_GREETING		= 'msgKeyGreeting';
 	static MSG_KEY_SIGNIN_STATUS_CHANGE		= 'msgKeySigninStatusChange';

 	static MSG_PUBLISHED		= 'The trip is published. ROLE can start to book the trip. Click My Activities menu to make changes';
 	static MSG_AT_PICKUP		= "I'm at pickup location";

 	static BODY_SHOW			= 'show' 			; 
 	static BODY_NOSHOW			= 'noshow' 			; 

	// if markers overlap, draw subsequent marks at a offset location
 	static MAP_OVERLAP_OFFSET	= 0.00004*5 		;
 	static MAP_LINE_COLOR_REGULAR	= 'blue' 		;
 	static MAP_LINE_COLOR_HIGHLIGHT	= 'red'			;
 	static MAP_LINE_COLOR_RIDER	= 'green'			;
 	static MAP_LINE_WEIGHT_REGULAR	= 1 			;	
 	static MAP_LINE_WEIGHT_HIGHLIGHT= 3 			;	
 	static MAP_VIEWPORT_MARGIN		= 50 			;	

 	static MAP_Z_INDEX_SHOW		= 300 				;	
 	static MAP_Z_INDEX_HIDE		= 100 				;	
 	static MAX_SEARCH_RESULT	= 100 				;	

 	static LOC_CURRENT1	= 'Current Location'		;	
 	static LOC_CURRENT2	= 'Current Location.'		;	

 	static ROUTE_MAP					= 'map'				;	
 	static ROUTE_MAP_SEARCH				= 'search'				;	
 	static ROUTE_MAP_QSEARCH			= 'quick_search'				;	
 	static ROUTE_MAP_ACTIVITIES			= 'activities'			;	
 	static ROUTE_MAP_SEARCH_RESULTES	= 'search_resultes'		;	

	

	constructor (){} 
	static TODAY() { // TODAY is browser local time and is in the form of 2018-09-11
		let utc = new Date();
		let d = new Date(utc.getTime() - utc.getTimezoneOffset() * 60000)
		let s = d.toJSON() ;
		console.debug ( '201810142022 Constants.TODAY()=', s	);

		return s.slice(0,10) ;
	} ; 

	static to_local_time(date : string) : string {
		let since_epoch = Date.parse(date);
		let utc = new Date();
		
		let d = new Date(since_epoch - utc.getTimezoneOffset() * 60000);
		let s = d.toJSON() ;
		return s;
	}

	static up_to_minutes( date: string) : string {
		let local_time = Constants.to_local_time(date);
		return local_time.slice(0,10) + ' ' + local_time.slice(11,16);	
	}

	static elapsed_time ( date: string) : string {
		let since_epoch = Date.parse(date);
		let utc = new Date();
		let minutes = Math.floor(( utc.getTime() -since_epoch + 10000)/60000);
		
		let days = Math.floor(minutes/60/24) ;
		let hours = Math.floor(minutes % (60*24)/60);
		let minutes2 = minutes % (60);
		let elapsed_time='';
		if (days!=0) { elapsed_time = elapsed_time+ days + ' days ago' ; }
		else if (hours!=0) { elapsed_time = elapsed_time+ hours + ' hr ago'; }
		else if (minutes2!=0) { elapsed_time = elapsed_time+ minutes2 + ' min ago';}
		else { elapsed_time= 'now'; }
		return elapsed_time;
	}

	static stringify(json: any) :string {
		return JSON.stringify(json,null,2);
	}
	
	static convert_trip_to_pair(trip: any): any|null {
		if(!trip) return null;
		let pair: any ={} ;
		pair.p1 ={
					loc		: trip.start_loc
				, lat		: trip.start_lat
				, lon		: trip.start_lon
				, display_name	: trip.start_display_name
				//, marker_text	: trip.start_marker_text
				//, icon_type	: trip.start_icon_type
				//, color	 : trip.start_color
			};
		pair.p2 ={
					loc		: trip.end_loc
				, lat		: trip.end_lat
				, lon		: trip.end_lon
				, display_name	: trip.end_display_name
				//, marker_text	: trip.end_marker_text
				//, icon_type	: trip.end_icon_type
				//, color	 : trip.end_color
			};
		return pair;
	}

	static convert_book_to_pair(book: any): any|null {
		if(!book) return null;
		let pair: any = {};
		pair.p1 ={
					loc		: book.pickup_loc
				, lat		: book.pickup_lat
				, lon		: book.pickup_lon
				, display_name	: book.pickup_display_name
				//, marker_text	: book.pickup_marker_text
				//, icon_type	: book.pickup_icon_type
				//, color	 : book.pickup_color
			};
		pair.p2 ={
					loc		: book.dropoff_loc
				, lat		: book.dropoff_lat
				, lon		: book.dropoff_lon
				, display_name	: book.dropoff_display_name
				//, marker_text	: book.dropoff_marker_text
				//, icon_type	: book.dropoff_icon_type
				//, color	 : book.dropoff_color
			};
		return pair;
	}



}

export class C extends Constants {
	constructor (){
		super();
	}
}
