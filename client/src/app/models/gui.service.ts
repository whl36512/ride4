import { Injectable } from '@angular/core';

import {DBService} from './remote.service'
import { C} from './constants';


//in order for require to work, change	src/tsconfig.app.json to read 
//	 "types": ["node"]

var forge = require('node-forge');

@Injectable({
	providedIn: 'root'
})
export class GuiService {

	constructor() { } ;
}

export class Status {
	static is_in_map_search = false;
	static search_result = [];
	static search_criteria :any|null = null;
	static rider_criteria : any | null = null
	static bookings_from_db : any | null = null  // for activity page
	static tran_from_db : any | null = null  // for transaction history page
	static scroll_position		: any	={};
	static current_page_pos		: any	={};
	static reviewee_from_db	: any= {};	//save reviewee and reviews here to avoid repeated DB retrieval
	static reviews_from_db	: any	= null;
	
}

export class UserService {
	constructor(	) {};

	static is_signed_in ():boolean
	{
		let profile =	UserService.get_profile_from_session();
		let jwt = UserService.get_jwt_from_session();
		if ( profile == null	|| jwt == null)
		{
			return false;
		}
		return true;
		}

	static remove_profile_from_session() {
		sessionStorage.removeItem(C.PROFILE);
	}

	static set_profile_to_session(user:any, jwt :any) {
		let profile = C.stringify(user);
		let jwt_string = jwt.jwt;
		//CryptoService.set_password(jwt_string);  //use jwt as password to encrypt profile
		let encrypted = CryptoService.encrypt(profile);
		
		StorageService.setSession(C.PROFILE, encrypted);
	}

	static get_profile_from_session(): object|null {
		let encrypted_profile = StorageService.getSession(C.PROFILE);
		let profile = CryptoService.decrypt(encrypted_profile);
		if ( profile == null) {return null;} ;
		return JSON.parse(profile);
	}

	static get_jwt_from_session(): object|null {
		let jwt = StorageService.getSession(C.JWT);
		if (jwt == undefined || jwt==null || jwt=='' ) { return null;} ;
		return {'jwt' : jwt}
	}

}

export class Util {
	
	constructor(	) {};
	static sleepFor( sleepDuration: number ){
		var now = new Date().getTime();
		while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
	}

	static deep_copy(obj : any): any {
		if( typeof( obj ) == 'string' )
		{
			let obj1 = {value: obj};
			return JSON.parse(C.stringify(obj)).value;
			
		}
		else {
			return JSON.parse(C.stringify(obj));
		}
	}

	static TODAY() { // TODAY is browser local time and is in the form of 2018-09-11
		let utc = new Date();
		let d = new Date(utc.getTime() - utc.getTimezoneOffset() * 60000)
		let s = d.toJSON() ;
		console.debug ( '201810142022 Util.TODAY()=', s	);

		return s.slice(0,10) ;
	} ;

	static current_time() {
		return Util.current_time_and_minutes(0);
	}

	static current_time_and_minutes(minutes: number) {
		let utc = new Date();
		let d = new Date(utc.getTime() - utc.getTimezoneOffset() * 60000 + minutes*60000);
		let s = d.toJSON() ;

		return [s.slice(0,10), s.slice(11,16)] ;
	}

	static now_ts ()
	{
		let utc = new Date();
		return utc.getTime() ;
	}

	static to_local_time(date : string) : string {
		let since_epoch = Date.parse(date);
		let utc = new Date();

		let d = new Date(since_epoch - utc.getTimezoneOffset() * 60000);
		let s = d.toJSON() ;
		return s;
	}

	static up_to_minutes( date: string) : string {
		let local_time = Util.to_local_time(date);
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



/*	not working. error TS2339: Property 'chrome' does not exist on type 'Window'.
	get_browser_vender() {
	// https://stackoverflow.com/questions/4565112/javascript-how-to-find-out-if-the-user-browser-is-chrome
		let isChromium = window.chrome;
		let winNav = window.navigator;
		let vendorName = winNav.vendor;
		let isOpera = typeof window.opr !== "undefined";
		let isIEedge = winNav.userAgent.indexOf("Edge") > -1;
		let isIOSChrome = winNav.userAgent.match("CriOS");
		vender: string;


		if (isIOSChrome) {
				// is Google Chrome on IOS
			vender ='IOSChrome';
			
		} else if (isOpera) {
			vender = 'Opera' ;
		} else if (isIEedge) {
			vender = 'Edge' ;
		} else if(
				isChromium !== null &&
				typeof isChromium !== "undefined" &&
				vendorName === "Google Inc." &&
				isOpera === false &&
				isIEedge === false
			) {
				// is Google Chrome
			vender='Google Chrome'
		} else { 
				// not Google Chrome 
			vender = 'Generic Chromium';
		}
	}
*/


	static get_stars(rating : number): string {
		if(rating) {
			return C.ICON_STAR.repeat(Math.round(rating)) + C.ICON_STAR_WHITE.repeat(5-Math.round(rating));
		} else {
			return 'unrated';
		}
	}
	static hide_map() {
		let map = document.getElementById('map');
	let button = document.getElementById('map-close-button');
		if(map) map.style.zIndex = C.MAP_Z_INDEX_HIDE + '';
		if(button) button.style.zIndex = C.MAP_Z_INDEX_HIDE + '';
	}

	static show_map() {
		let map = document.getElementById('map');
	let button = document.getElementById('map-close-button');
		if(map) map.style.zIndex = C.MAP_Z_INDEX_SHOW + '';
		if(button) button.style.zIndex = (C.MAP_Z_INDEX_SHOW +1) +'';
	}

	static toggle_map() {
		if (Util.get_z_index('map') == C.MAP_Z_INDEX_SHOW) Util.hide_map();
		else	Util.show_map();
	}

	static get_z_index(elem_id :string) : number|null {
		let elem= document.getElementById(elem_id);
		if (elem) {
			return Number(elem.style.zIndex);
		}
		return null;
	}

	static list_global_objects () {
			var keys=Object.keys( window ).sort();
			for (var i in keys)
			{
				if (typeof window[keys[i]] != 'function')
					console.debug('2018270951 Util.list_global_objects()', keys[i], window[keys[i]]);
			}
	}

	static map_search_start() {
		Status.is_in_map_search = true;
	}

	static map_search_stop() {
		Status.is_in_map_search = false;
	}

	static is_in_map_search() :boolean {
		if (!Status.is_in_map_search) return false;
		if( Util.get_z_index('map') == C.MAP_Z_INDEX_SHOW ){
			// map search only happens when map is in the backround. So if the map's z-index is high
			// it is NOT in map search
			Status.is_in_map_search = false;
		}
		return Status.is_in_map_search ;
	}

	static create_empty_location () : any{
		return	  {			loc	 : ''
						,   lat	 : null
						,   lon	 : null
						,   display_name: null
					}
	}
	static create_empty_trip () : any{
		let [today, current_time] = Util.current_time();
		let [date2, dummy] = Util.current_time_and_minutes(C.MAX_TRIP_DAYS*24*60);
		//let [date2, dummy] = Util.current_time_and_minutes(24*7*60);

		let trip =  {
			  version			:   C.VERSION_FORM_TRIP
			, rider_ind			:   false
			, trip_date			:   today
			, date1				:   today			//for search
			, date2				:   date2			//for quick search
			, trip_time			:   current_time
			, distance			:   C.ERROR_NO_ROUTE
			, seats				:   1
			, price				:   C.MAX_PRICE/2
			, p1				:	Util.create_empty_location()
			, p2				:	Util.create_empty_location()
			, description		:	''			//for publish
			, search_tightness	:	3			//for search
			}
		return trip;
	}



	static onError(error) {
			console.log(`Error: ${error}`);
	}

	static reset_zoom() {
		console.debug('201810272157 Util.reset_zoom enter');
		let browser=window['chrome'] ;
		if ( browser ) {
			if(browser.tabs) {
			let func_var = Util.onGot_reset;
			let gettingZoom = browser.tabs.getZoom(function(zoom) { func_var(zoom)});
			//gettingZoom.then(Util.onGot_reset, Util.onError);
			} else {
				console.debug('201810272157 Util.reset_zoom browser.tabs==null');
			}
			
		}
		else {
			console.debug('201810272157 Util.reset_zoom browser == null');
		}
		
	}

	static onGot_reset(zoom) {
		console.debug('201810272157 Util.onGot_reset zoom=', zoom);
		if (zoom==1) return;
		let browser=window['chrome'] ;
		if ( browser) {
			var setting = browser.tabs.setZoom(1.0);
		//	setting.then(null, Util.onError);
			//	console.log(zoom);
		}
	}

	static convert_pair_to_trip(pair): any| null {
		if(!pair) return null;
		let p1=pair.p1;
		let p2=pair.p2;
			
		if(p1) {
			pair.start_loc			=p1.loc
			pair.start_lat			=p1.lat
			pair.start_lon			=p1.lon
			pair.start_display_name	=p1.display_name ;
		}
		if(p2) {
			pair.end_loc			=p2.loc
			pair.end_lat			=p2.lat
			pair.end_lon			=p2.lon
			pair.end_display_name	=p2.display_name ;
		}
		if(pair.date1)	pair.start_date	=pair.date1;
		if(pair.date2)	pair.end_date	=pair.date2;
		return pair;
	}

	static convert_pair_to_book(pair): any| null {
		if(!pair) return null;
		let p1=pair.p1;
		let p2=pair.p2;
			
		if(p1) {
			pair.pickup_loc=p1.loc
			pair.pickup_lat=p1.lat
			pair.pickup_lon=p1.lon
			pair.pickup_display_name=p1.display_name ;
		}
		if(p2) {
			pair.dropoff_loc=p2.loc
			pair.dropoff_lat=p2.lat
			pair.dropoff_lon=p2.lon
			pair.dropoff_display_name=p2.display_name ;
		}
		return pair;
	}

	static convert_book_to_pairs(book: any): any|null {
		if(!book) return null;
		if (!book.p1 || ! book.p1.lat) {
			book.p1 ={
				  loc	  : book.start_loc
				, lat	  : book.start_lat
				, lon	  : book.start_lon
				, display_name  : book.start_display_name
				//, marker_text   : book.pickup_marker_text
				//, icon_type	 : book.pickup_icon_type
				//, color	: book.pickup_color
			};
		}
		if (!book.p2 || ! book.p2.lat) {
			book.p2 ={
				  loc	  : book.end_loc
				, lat	  : book.end_lat
				, lon	  : book.end_lon
				, display_name  : book.end_display_name
				//, marker_text   : book.dropoff_marker_text
				//, icon_type	 : book.dropoff_icon_type
				//, color	: book.dropoff_color
			};
		}
		if (!book.rp1 || ! book.rp1.lat) {
			book.rp1 ={
				  loc	  : book.pickup_loc
				, lat	  : book.pickup_lat
				, lon	  : book.pickup_lon
				, display_name  : book.pickup_display_name
				//, marker_text   : book.pickup_marker_text
				//, icon_type	 : book.pickup_icon_type
				//, color	: book.pickup_color
			};
		}
		if (!book.rp2 || ! book.rp2.lat) {
			book.rp2 ={
				  loc	  : book.dropoff_loc
				, lat	  : book.dropoff_lat
				, lon	  : book.dropoff_lon
				, display_name  : book.dropoff_display_name
				//, marker_text   : book.dropoff_marker_text
				//, icon_type	 : book.dropoff_icon_type
				//, color	: book.dropoff_color
			};
		}
		return book;
	}
}

/*
export class CookieService {
		constructor() { } ;
	
	static setCookie (cname, cvalue, exhours) {
			let d = new Date();
		d.setTime(d.getTime() + (exhours*60*60*1000));
			let expires = "expires="+ d.toUTCString();
		document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
	}

	static getCookie (cname) : string {
		var name = cname + "=";
		var decodedCookie = decodeURIComponent(document.cookie);
		var ca = decodedCookie.split(';');
		for(var i = 0; i <ca.length; i++) {
			let c = ca[i];
			while (c.charAt(0) === ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) === 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}
}
*/


export class CryptoService {
//private static forge = new Forge();

	private static salt_hex ="d043f85493366994d4e73441e2bd387be856c815a924ffb295ee53125df26d8b";
	private static salt = forge.util.hexToBytes(CryptoService.salt_hex);
	//rideCrypt.salt = forge.random.getBytesSync(32);
	private static numIterations = 10;
	//public static password : string='password';
	public static password : string='d043f85493366994d41';
	public static dummy : string='AES-CTR';
	public static mode : string='AES-CBC';
	//private static key = forge.pkcs5.pbkdf2('password', CryptoService.salt, CryptoService.numIterations, 16);
	private static key = forge.pkcs5.pbkdf2(CryptoService.password, CryptoService.salt, CryptoService.numIterations, 16);
	//private static iv = forge.util.hexToBytes(CryptoService.salt_hex);

	constructor(	) {
	}


	// generate a random key and IV
	// Note: a key size of 16 bytes will use AES-128, 24 => AES-192, 32 => AES-256

	/* alternatively, generate a password-based 16-byte key
	var salt = this.forge.random.getBytesSync(128);
	var key = this.forge.pkcs5.pbkdf2('password', salt, numIterations, 16);
	*/

	// encrypt some bytes using CBC mode
	// (other modes include: ECB, CFB, OFB, CTR, and GCM)
	// Note: CBC and ECB modes use PKCS#7 padding as default

	static set_password(password:string){
		CryptoService.password = password;
		CryptoService.key = forge.pkcs5.pbkdf2(CryptoService.password
								, CryptoService.salt, CryptoService.numIterations, 16);
	}

	static encrypt	(content : string) : string {
		let cipher = forge.cipher.createCipher(CryptoService.mode, CryptoService.key);
		let iv = forge.random.getBytesSync(16);

		cipher.start({iv: iv});
		cipher.update(forge.util.createBuffer(content));
		cipher.finish();
		let encrypted = cipher.output;
		let hex = encrypted.toHex() ;
		let iv_hex = forge.util.bytesToHex(iv)
		console.debug('201808171902 CryptoService.encrypt() encrypted_hex=' + hex);
		return iv_hex+ '-'+ hex;
	};

	static decrypt(encrypted_hex: string): string|null
	{
		if (!encrypted_hex || encrypted_hex=='null' || encrypted_hex=="") return null ;
		// decrypt some bytes using CBC mode
		// (other modes include: CFB, OFB, CTR, and GCM)

		let hexes = encrypted_hex.split('-');
		let iv 			= forge.util.hexToBytes(hexes[0]) ;
		let encrypted 	= forge.util.hexToBytes(hexes[1]) ;
		let buffer	= forge.util.createBuffer(encrypted);

		let decipher = forge.cipher.createDecipher(CryptoService.mode, CryptoService.key);
		decipher.start({iv: iv});
		decipher.update(buffer);
		let result = decipher.finish(); // check 'result' for true/false

		let decrypted: string =null;
		try {
			// outputs decrypted hex //may have 'ERROR URIError: URI malformed' if password is wrong 
			decrypted = decipher.output.toString('utf8') ; 

		}
		catch (error) {
			console.error('201812262249', 'CryptoService.decrypt ignore error=', error);
		}
		console.info("201808171500 CryptoService.decrypt() decrypted=" + decrypted);
		return decrypted;
	}

/*
	private byteToHexString (uint8arr: Uint8Array) {
		if (!uint8arr) {
			return '';
		}
			
		var hexStr = '';
		for (var i = 0; i < uint8arr.length; i++) {
			var hex = (uint8arr[i] & 0xff).toString(16);
			hex = (hex.length === 1) ? '0' + hex : hex;
			hexStr += hex;
		}
			
		return hexStr.toUpperCase();
	}
	
	private hexStringToByte (str: String): Uint8Array {
		if (!str) {
			return new Uint8Array();
		}
		var a = [];
		for (var i = 0, len = str.length; i < len; i+=2) {
			a.push(parseInt(str.substr(i,2),16));
		}
		return new Uint8Array(a);
	}
*/
}

export class StorageService {
	static setLocal(key: string, value: any): void{
		localStorage.setItem(key, value);
	}
	static getLocal(key: string): any{
		let value=localStorage.getItem(key);
		return value;
	}
	static setSession(key: string, value: any): void{
		sessionStorage.setItem(key, value);
	}
	static getSession(key: string): any{
		let value=sessionStorage.getItem(key);
		return value;
	}

	static storeForm(key : string, json_value) : void {
		StorageService.setLocal(key, C.stringify(json_value));
	}

	static getForm(key) : any{
		console.debug('StorageService.getForm() 201809241133 key =' + key);
		let form_value= StorageService.getLocal (key);
		if (form_value== undefined || form_value == null) return null;
		console.debug('StorageService.getForm() 201809241133 form_value =' + form_value);
		let form_value1 = JSON.parse(form_value);

		//console.info('201809241146 form_value1 =' + C.stringify(form_value1));
		return form_value1;
	}
}

