//https://blogs.msdn.microsoft.com/premier_developer/2018/06/17/angular-how-to-simplify-components-with-typescript-inheritance/

import { Component				} 	from '@angular/core';
import { NgZone					} 	from '@angular/core';
import { OnInit 				} 	from '@angular/core';
import { OnDestroy 				} 	from '@angular/core';
import { Subscription 			}	from 'rxjs';
import { ChangeDetectorRef 		}	from '@angular/core';
import { FormBuilder			}	from '@angular/forms';
import { FormGroup 				} 	from '@angular/forms';
import { timer 					}	from 'rxjs' ;
import { Router					}	from '@angular/router';
import { NavigationEnd					}	from '@angular/router';
//import { TimerObservable } from 'rxjs/observable/TimerObservable';
import { map, filter, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { OnChanges				}   from '@angular/core';
import { SimpleChanges			}   from '@angular/core';
import { SimpleChange		   }   from '@angular/core';
import { HostListener }					 from '@angular/core';
import * as Rx from "rxjs";




//import { EventEmitter, Input, Output} from '@angular/core';


import { AppInjector			} 	from '../../models/app-injector.service' ;
import { CommunicationService	}	from '../../models/communication.service' ;
import { DBService				} 	from '../../models/remote.service' ;
import { GeoService				} 	from '../../models/remote.service' ;
import { MapService				} 	from '../../models/map.service';
import { AppComponent			} 	from '../../app.component';
import { C						}	from '../../models/constants';
//import { StorageService		} 	from '../../models/gui.service';
import { UserService			} 	from '../../models/gui.service';
import { DotIcon				} 	from '../../models/map.service';
import { PinIcon				} 	from '../../models/map.service';
import { Util					} 	from '../../models/gui.service';
import { Status					} 	from '../../models/gui.service';



@Component({
	//selector: 'app-base',
	//templateUrl: './base.component.html',
	template: '',
	//styleUrls: ['./base.component.css']
})
//export abstract class BaseComponent implements OnChanges, OnInit, OnDestroy {
export class BaseComponent implements OnChanges, OnInit, OnDestroy {

	//mapService				: MapService			;
	//storageService			: StorageService		;	
	//communicationService	: CommunicationService	;	
	//dbService 				: DBService				;	
	//geoService				: GeoService			;	
	//changeDetectorRef		: ChangeDetectorRef 	;
	//form_builder			: FormBuilder 			;
	//router					: Router	 			;
	//zone					:	NgZone

	error_msg				: string|null	= null;
	warning_msg 			: string|null	= null;
	info_msg				: string|null	= null;
	validation_error		: string|null	= null;
	change_detect_count		: number 		= 0;
	show_body				: string|null	= C.BODY_SHOW ;
	is_signed_in			: boolean 		= false;
	page_name 				: string| null 	= null;
	form 					: FormGroup|null= null;	// main for of a page
	//current_loc 			= 			{lat:null, lon:null};
	current_loc 			: any =	null;
	form_values_old			: any = {}			;
	form_values_new			: any = {}			;
	today					: string			;	// browser local date
	current_time			: string			;	// browser local time

	static timer = timer(C.TIMER_INTERVAL, C.TIMER_INTERVAL);

	class_name = this.constructor.name;

	subscription0			: Subscription |null = null;
	subscription1			: Subscription |null = null;
	subscription2			: Subscription |null = null;
	subscription3			: Subscription |null = null;
	form_status_sub			: Subscription |null = null;
	form_value_sub			: Subscription |null = null;
	ws_sub					: Subscription |null = null;
	geo_getter_observable	: any 			;
	geo_getter_sub			: Subscription |null = null;
	timer_for_injector_sub	: Subscription |null = null;
	timer_sub				: Subscription |null = null;

	C = C;
	//Constants = C;
	Util = Util;
	Status = Status;


	//protected logError(errorMessage: string) { . . . }	
	//private logNavigation() { . . . }
	@HostListener('window:scroll', ['$event'])
	on_window_scroll(e) {
		console.debug('201810131753', this.page_name, '.on_window_scroll() event=', e);
		Status.scroll_position[this.page_name] = window.pageYOffset ;
		console.debug('201810131753', this.page_name
			, '.on_window_scroll() Status.scroll_position=' 
			, Status.scroll_position[this.page_name]);
	}


	constructor(public changeDetectorRef		: ChangeDetectorRef
				, public mapService				: MapService			
				, public communicationService	: CommunicationService
				, public dbService 				: DBService			
				, public geoService				: GeoService	
				, public form_builder			: FormBuilder 
				, public router					: Router	 
				//public zone: NgZone
				) { 
		console.debug('201811041002', this.class_name, '.constructor() enter.');
		//this.subscribe_geo_watcher();
		//this.subscribe_websocket();

		[this.today, this.current_time] = Util.current_time();
		console.debug('201811041002', this.class_name, '.constructor() exit.');
	}


	ngOnInit() { 
		console.debug ('201810290933 ', this.class_name,'.ngOnInit() enter.');
		this.is_signed_in= UserService.is_signed_in();

		if(!this.subscription0) this.subscription0 =this.communicationService.msg.subscribe(
			msg	=> {
				//let message = JSON.parse(msg);
				//this.subscription_action(message);
				this.subscription_action(msg);
			}
		);
		//this.subscribe_geo_watcher();
		//this.communicationService.ws_send(C.MSG_KEY_GREETING, `{"say":"Greeting from ${this.class_name}"}` );
		this.ngoninit();
		this.subscribe_form_change();
		//this.subscribe_nav_end();
		console.debug ('201810290933 ', this.class_name,'.ngOnInit() exit.');
	}

	ngOnChanges(changes: SimpleChanges) {
		// It’s called before ngOnInit and whenever one or more data-bound input properties change.
		console.debug("201809262246", this.class_name, ".ngOnChanges() enter");
		this.ngonchanges(changes);
		console.debug("201809262246", this.class_name, ".ngOnChanges() exit");
	}


	subscribe_form_change(){
		if (!this.form) return;
		this.form_value_sub=this.form.valueChanges.pipe(
			debounceTime(C.FORM_DEBOUNCE_TIME)
			,distinctUntilChanged((v1,v2) => C.stringify(v1)===C.stringify(v2)) 
			).subscribe(newValues => { 
					console.debug('201811172143', this.class_name, 'subscribe_form_change() newValues=');
					console.debug(C.stringify(newValues));
					this.form_values_new = Util.deep_copy(newValues);
					this.form_change_action();
					this.form_values_old = Util.deep_copy(newValues);
				}
			);
		this.form_status_sub = this.form.statusChanges
			.subscribe(data => console.log('Form status changes', data));
	}

	form_change_action() {};

	form_loc_change_detect(): any {
		let o = this.form_values_old;
		let n = this.form_values_new;
		let l1: string =null;
		let l2: string =null;
		if (n.p1_loc != o.p1_loc) l1='p1_loc';
		if (n.p2_loc != o.p2_loc) l2='p2_loc';
		return [l1, l2];
	}	

	

	
	websocket_retry_count=0;
	subscribe_websocket()
	{
		if (this.websocket_retry_count > 2)
		{
			console.error("ERROR 201811141550", this.class_name
				, '.subscribe_websocket() retried', this.websocket_retry_count, 'times. Bail out');
			return;
		}
		this.websocket_retry_count +=1;
		if(!this.ws_sub) 
			this.ws_sub
				=this.communicationService.ws_subject.subscribe(
					msg	=> {
						console.debug ('201811142241 ', this.class_name
							,'.subscribe_websocket() got message. msg=');
						console.debug (msg);
						this.websocket_retry_count=0;
						this.subscription_action(msg);
					},
					err	=> 	{	console.error("ERROR 201811141549 err=", err); 
								this.ws_sub.unsubscribe()	
								this.ws_sub= null;
								//this.subscribe_websocket();
								//this.communicationService.ws_send(C.MSG_KEY_GREETING, `{"say":"Greeting from ${this.class_name}"}` );
							},
					()	=> 	{ 	console.info ("201811141518 websocket closed"); 
								this.ws_sub= null;
							}
				);
	}
	
	//abstract ngoninit(): void;
	ngoninit(): void{};
	ngonchanges(changes: SimpleChanges): void {};


	ngOnDestroy(): void {
		console.debug ('201810290932 ', this.class_name,'.ngOnDestroy() enter.');
		// prevent memory leak when component destroyed
		if( this.subscription0	!= null)	this.subscription0.unsubscribe();
		if( this.subscription1	!= null)	this.subscription1.unsubscribe();
		if( this.subscription2	!= null)	this.subscription2.unsubscribe();
		if( this.subscription3	!= null)	this.subscription3.unsubscribe();
		if( this.form_value_sub	!= null)	this.form_value_sub.unsubscribe();
		if( this.form_status_sub!= null)	this.form_status_sub.unsubscribe();
		if( this.timer_sub		!= null)	this.timer_sub.unsubscribe();
		if( this.ws_sub			!= null)	this.ws_sub.unsubscribe();
		if( this.geo_getter_sub!= null)		this.geo_getter_sub.unsubscribe();
		//if( this.nav_end_sub!= null) 		this.nav_end_sub.unsubscribe();
		this.communicationService.send_msg(C.MSG_KEY_MAP_BODY_NOSHOW, {});
		this.onngdestroy();
		console.debug ('201810290932 ', this.class_name,'.ngOnDestroy() exit.');
	}

	onngdestroy(){}

	subscription_action(msg): void{
		this.subscription_action_ignore();
	}
	
	subscription_action_ignore()
	{
		console.debug('DEBUG 201810312014', this.class_name, '.subscription_action() ignore msg'); 
	}

	reset_msg() : void{
		this.error_msg	=null ;
		this.warning_msg=null ;
		this.info_msg	=null ;
	}

	change_detect_counter(e): number
	{
		console.debug("201810131845 Constants.change_detect_counter() event=", e)	;
		return this.change_detect_count ++;
	}

	onSubmit(){}

	trackByFunc (index, item) {
		if (!item) return null;
		return index;
	}

	list_global_objects() {
		Util.list_global_objects();
	}

	geocode(element_id: string, pair, form):any {
		console.debug('201800111346', this.class_name, '.geocode() element_id =' , element_id);

		let pair_before_geocode = Util.deep_copy(pair) ;
		var p :any ;
		let loc_old	='';

		if (element_id == "p1_loc" ) {
			p= pair.p1 ;
			loc_old = p.loc	;
			p.loc = form.value.p1_loc;
		} else {
			p= pair.p2;
			loc_old= p.loc	;
			p.loc = form.value.p2_loc;
		}

		if(loc_old.trim() === p.loc.trim()) return; // no change
		if (p.loc.length < 3) {
			p.lat = null;
			p.lon = null;
			p.display_name= null;
			//this.communicationService.send_msg(C.MSG_KEY_MARKER_CLEAR, {});
			//this.communicationService.send_msg(C.MSG_KEY_MARKER_PAIR, pair);
			//this.communicationService.send_msg(C.MSG_KEY_MARKER_FIT, pair);

			//this.validate_form();
			//this.changeDetectorRef.detectChanges();
			this.routing(pair, pair_before_geocode);
			return; // must type at least 3 letters before geocoding starts
		}

		else {
			let loc='';
			if ( p.loc==C.LOC_CURRENT1 || p.loc==C.LOC_CURRENT2)  // obsolete
				loc = this.mapService.current_loc.lat + ',' + this.mapService.current_loc.lon ;
			else loc = p.loc;

			let loc_response = this.geoService.geocode(loc) ;
			loc_response.subscribe(
				body =>	 {
					console.debug('201809111347 SearchSettingComponent.geocode()	body=' );
					console.debug( C.stringify(body) );
					if (body[0]) {
						p.lat			=body[0].lat ;
						p.lon			=body[0].lon ;
						p.display_name=body[0].display_name ;
					}
					else {
						p.lat = null;
						p.lon = null;
						p.display_name= null;
					}
					//this.communicationService.send_msg(C.MSG_KEY_MARKER_CLEAR, {});
					//this.communicationService.send_msg(C.MSG_KEY_MARKER_PAIR, pair);
					//this.communicationService.send_msg(C.MSG_KEY_MARKER_FIT, pair);
					//this.validate_form();
					//this.changeDetectorRef.detectChanges();
					this.routing(pair, pair_before_geocode);
					//this.mapService.try_mark_pair ( pair);
				//		this.show_map()
				}
			);
		}
	}

	routing(pair, pair_before_geocode)
	{
		if ( !pair.p1.display_name || ! pair.p2.display_name
			|| pair.p1.lat==pair.p2.lat && pair.p1.lon== pair.p2.lon) {
			pair.distance=C.ERROR_NO_ROUTE ;
			//this.validate_form();
			//this.changeDetectorRef.detectChanges();
			return;
		}
		else if (	pair.p1.lat == pair_before_geocode.p1.lat
				&&	pair.p1.lon == pair_before_geocode.p1.lon
				&&	pair.p2.lat == pair_before_geocode.p2.lat
				&&	pair.p2.lon == pair_before_geocode.p2.lon) {
			// no change of latlon. Skip routing
			//pair.distance= oair_before_geocode.distance;
			//this.validate_form();
			//this.changeDetectorRef.detectChanges();
			return;
		}

		//both start and end are geocoded. So we can calc routes
		let route_response = this.geoService.routing(
					pair.p1.lat
				, 	pair.p1.lon
				, 	pair.p2.lat
				, 	pair.p2.lon
			);
		route_response.subscribe(
			body => {
				console.info("201808201201", this.class_name, '.routing() body =\n' , C.stringify(body));
				if( body.routes.length >0 ) {
					let distance=body.routes[0].distance ;
					pair.distance= Math.round(distance /160)/10;
					//this.validate_form();
					//this.changeDetectorRef.detectChanges();
				}
				else if ( body.error) {
					this.error_msg='Error from routing service: ' + body.error.message;
				}
				else {
					pair.distance=C.ERROR_NO_ROUTE ;
					//this.validate_form();
					//this.changeDetectorRef.detectChanges();
				}
			},
			error => {
				pair.distance=C.ERROR_NO_ROUTE ;
				//this.validate_form();
				//this.changeDetectorRef.detectChanges();
			}
		);
	}

	private package_payload(payload) : any {
		// add profile into the payload. server side must compare jwt and profile to make sure they match
		let jwt=  UserService.get_jwt_from_session();
		let profile = UserService.get_profile_from_session()

		let combined_payload = {...payload, ...profile, ...jwt };
		//console.debug("201808190206", this_calss_name
			//, 'package_payload() after adding jwt and profile combined_payload=\n'
			//, C.stringify(combined_payload));
		return combined_payload;
	}

	call_socket(relative_url: string, payload: any) {
		let combined_payload = this.package_payload(payload);
		this.communicationService.ws_send(relative_url, combined_payload);
	}

	call_wservice(url, payload)
	{
		this.reset_msg();
		this.changeDetectorRef.detectChanges() ;
		let payload1 = Util.deep_copy(payload);
		let data_from_db_observable  = this.dbService.call_db(url, payload1);
		data_from_db_observable.subscribe(
			data_from_db => {
				console.info("201808201201", this.class_name, ".call_wservice() data_from_db ="
					, C.stringify(data_from_db));
				if (data_from_db.error_desc) {
					this.reset_msg();
					this.error_msg = 'ERROR: ' + data_from_db.error_desc;
				}
				else {
					this.on_get_data_from_wservice(data_from_db);
					}
				this.changeDetectorRef.detectChanges() ;
			},
			error => {
				this.reset_msg();
				this.error_msg=error;
				this.changeDetectorRef.detectChanges() ;
			}
		)
	}

	on_get_data_from_wservice(data_from_db: any) { };
	validate_form(){}
	show_reviews(other_usr_id: string){
		this.router.navigate(['/reviews',  other_usr_id]);
	}



/*
	getLocation() {
			if (navigator.geolocation) {
			let func_var= this.gotPosition;
			navigator.geolocation.getCurrentPosition(func_var);
		}
	}
	gotPosition(position) {
		this.current_loc.lat = position.coords.latitude;
		this.current_loc.lon = position.coords.longitude ;
		console.debug ( '201810271949 mapService.gotPosition() latitude longitude'
			, this.current_loc.lat, this.current_loc.lon );
	}
*/

    getPosition(geolocationOptions) {
        // modeled after MapServive.watchPosition()
        if (!window.navigator.geolocation) {
			this.error_msg='GPS not supported by the browser';
			return null;
		}
        let source =  Rx.Observable.create(
            function (observer) {
                window.navigator.geolocation.getCurrentPosition(
                    function successHandler (loc) { observer.next(loc); }
                    , function errorHandler (err) { observer.error(err); }
                    , geolocationOptions
                );
            }
        )

        //return source.publish().refCount();
        if (source) {
            console.debug('201811171420 MapService.getPosition() geolocation observable created source=');
            console.debug(source);
        }
        else  {
            console.debug('201811171420 MapService.getPosition() geolocation observable failed');
        }
        return source;
    }

    subscribe_geo_getter() {
        console.debug('201811171456' , 'GeoService.subscribe_geo_getter enter');
        if(!this.geo_getter_observable) this.geo_getter_observable = this.getPosition(null);
		if (! this.geo_getter_observable) return null;
		if ( this.geo_getter_sub) {
			this.geo_getter_sub.unsubscribe(); 
			this.geo_getter_sub= null;
		}
		
        this.geo_getter_sub = this.geo_getter_observable.subscribe(
            position => {
                console.debug('201811171337', this.page_name, 'subscribe_geo_getter()'
                    , `Next: ${position.coords.latitude}, ${position.coords.longitude}`);
                this.current_loc = {lat : Math.round(position.coords.latitude*10000000)/10000000.0
                				,	lon : Math.round(position.coords.longitude*10000000)/10000000.0
									};
				this.on_get_geo_pos(this.current_loc);
                },

            err => {
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        this.error_msg = 'GPS Permission denied';
                        break;
                    case err.POSITION_UNAVAILABLE:
                        this.error_msg = 'GPS Position unavailable';
                        break;
                    case err.PERMISSION_DENIED_TIMEOUT:
                        this.error_msg = 'GPS Position timeout';
                        break;
                }
                console.error('ERROR: 201811171434', this.page_name, '.subscribe_geo_getter'
						,  this.error_msg);
            },
            () => console.debug('201811171343', this.page_name, '.subscribe_geo_getter completed')
        );
    }
	
	on_get_geo_pos(location:any) {};  

}


