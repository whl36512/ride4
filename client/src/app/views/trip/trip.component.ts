// https://angular.io/guide/reactive-forms
// https://angular.io/guide/form-validation

import { Component} from '@angular/core';
import { OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { ValidatorFn } from '@angular/forms';
import { ValidationErrors } from '@angular/forms';
import { AbstractControl} from '@angular/forms';
//import { Subscription }	from 'rxjs';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { NgZone } from '@angular/core';
import { Router			 }   from '@angular/router';
import { ActivatedRoute			 }   from '@angular/router';


//import { EventEmitter, Input, Output} from '@angular/core';

import { GeoService} from '../../models/remote.service' ;
import { DBService} from '../../models/remote.service' ;
import { CommunicationService} from '../../models/communication.service' ;
import { AppComponent } from '../../app.component';
import { C} from '../../models/constants';
import { StorageService } from '../../models/gui.service';
import { Util } from '../../models/gui.service';
import { BaseComponent } from '../base/base.component' ;
import { MapService			 }   from '../../models/map.service';



@Component({
  selector	: 'app-trip'			,
  templateUrl	: './trip.component.html'	,
  styleUrls	: ['./trip.component.css']	,
  // prevent change detection unless @Input reference is changed
  changeDetection: ChangeDetectionStrategy.OnPush ,  

})

export class TripComponent extends BaseComponent {
	// when *ngIf is true, both constructor() and ngOnInit() are called. constructor is called first then ngOnInit
	// the html needs  trip to populate its input fields. If trip==undefined, angular will keep calling constructor. 
	// By initialize trip to an empty structure, repeated calling of constructor can be avoided
		form_saved_to_db: boolean=false;

	trip		:any;
	button_label 	= 'Publish Trip';
	user_from_db: any = {};
	show_form		= C.BODY_SHOW;
	max_price		=C.MAX_PRICE;
	form_key		=	C.KEY_FORM_SEARCH // or C.KEY_FORM_TRIP
	from		:string;
	to			:string;
	current_location_msg: string = null;

	constructor( public changeDetectorRef   : ChangeDetectorRef
				, public mapService			 : MapService
				, public communicationService   : CommunicationService
				, public dbService			  : DBService
				, public geoService			 : GeoService
				, public form_builder		   : FormBuilder
				, public router				 : Router 
				, public route: ActivatedRoute)  {
		super(changeDetectorRef,mapService, communicationService, dbService
				, geoService, form_builder, router );

		this.router.routeReuseStrategy.shouldReuseRoute = function() {
			// force recreate of component, so this.route.snapshot.paramMap.get will work
       		return false;
		};

		this.page_name= C.PAGE_TRIP;
        this.timer_sub = BaseComponent.timer.subscribe(
           val => {
                if(val >5 && val % 1 == 0) {
					this.validation_error=this.validate_form();
					this.changeDetectorRef.detectChanges() ;
                }
            },
        );


  		console.log("201811011725", this.class_name, '.constructor() exit')  ;
  	} 

	ngoninit():void {
  		this. form_key = this.route.snapshot.paramMap.get('form_key');
		if ( ! (this.form_key == C.KEY_FORM_TRIP || this.form_key==C.KEY_FORM_SEARCH)) {
			this.router.navigate(['/home']);
		}
		

		this.setup_form();
		this.form_change_action();
		if ( this. form_key == C.KEY_FORM_TRIP) {
			let data_from_db_observable	 = this.dbService.call_db(C.URL_GET_USER, {});
			data_from_db_observable.subscribe(
				user_from_db => {
					console.debug("201808201201 TripComponent.ngoninit() user_from_db =" 
						, C.stringify(user_from_db));
					this.user_from_db =user_from_db;
				},
				error => {
					this.error_msg=error;
					//this.changeDetectorRef.detectChanges() ;
				}
			);
		}
		//this.changeDetectorRef.detectChanges() ;
	}

	setup_form()
	{

		let trip = StorageService.getForm(this.form_key);
		if ( !trip || trip.version !=C.VERSION_FORM_TRIP) { // both search and trip use the same version
			trip = Util.create_empty_trip();
		}
		if (trip.trip_date) trip.trip_date 	=  this.today > trip.trip_date ? this.today: trip.trip_date ;
		if (trip.date1) 	trip.date1 		=  this.today > trip.date1 ? this.today: trip.date1 ;
		if (trip.date2) 	trip.date2 		=  this.today > trip.date2 ? this.today: trip.date2 ;
	
		StorageService.storeForm(this.form_key, trip);
		this.trip=trip;

/*
		if (this.trip.p1.loc == C.LOC_CURRENT1 || this.trip.p1.loc == C.LOC_CURRENT2 ) 
			this.trip.p1	= Util.create_empty_location();
		if (this.trip.p2.loc == C.LOC_CURRENT1 || this.trip.p2.loc == C.LOC_CURRENT2 )
			this.trip.p2	= Util.create_empty_location();
*/

		this.form= this.form_builder.group(
			{
				//sync validators must be in an array
				rider_ind			: [trip.rider_ind, [Validators.required]], 
				p1_loc				: [trip.p1.loc, [Validators.required]], 
				p2_loc				: [trip.p2.loc, [Validators.required]], 
				trip_date			: [trip.trip_date, [Validators.required, Validators.min]], 
				date1				: [trip.date1, [Validators.required, Validators.min]], 
				date2				: [trip.date2, [Validators.required, Validators.min]], 
				trip_time			: [trip.trip_time, [Validators.required]], 
				seats				: [trip.seats, [Validators.required]], 
				price				: [trip.price, [Validators.required]], 
				description			: [trip.description, ], 
				search_tightness	: [trip.search_tightness, ], 
			},	 
			{ 
				//validator		: this.validate_trip
			}
		);
	
		this.show_map();
		this.show_body=C.BODY_SHOW;
  	}

	form_change_action(){
		this.reset_msg() ;
		let f= this.form.value;
		if (f.rider_ind) 	this.max_price	=	C.MAX_PRICE_RIDER;
		else				this.max_price	=	C.MAX_PRICE;

		if (f.rider_ind ) 	this.from 	= 'Pickup Location';
		else				this.from	= 'Departure Location';

		if (f.rider_ind ) 	this.to		= 'Dropoff Location';
		else				this.to		= 'Arrival Location';
		console.debug("201808201534", this.class_name, "form_change_action() this.from" , this.from);

		let [changed_loc1, changed_loc2]=this.form_loc_change_detect();
		if ( changed_loc1) this.geocode(changed_loc1, this.trip, this.form) ;
		if ( changed_loc2) this.geocode(changed_loc2, this.trip, this.form) ;
	}

	onSubmit() {
		this.reset_msg() ;
		this.validation_error = this.validate_form() ;
		if( this.validation_error) {
			return;
		}
        //this.changeDetectorRef.detectChanges();

		// save trip to db
		// combining data
		this.trip = { ...this.trip, ...this.form.value};
		this.trip.p1.loc = this.form.value.p1_loc;
		this.trip.p2.loc = this.form.value.p2_loc;
		delete this.trip.p1_loc;
		delete this.trip.p2_loc;
		StorageService.storeForm(this.form_key, this.trip);

		if (this.form_key == C.KEY_FORM_TRIP) {
			let trip_to_db = Util.deep_copy( this.trip);
			let trip_from_db_observable	 = this.call_wservice(C.URL_INS_TRIP, trip_to_db);
		}
		else if (this.form_key == C.KEY_FORM_SEARCH) {
            let url = '/map';
            this.router.navigate([url, 'search']);
		}
	}

	on_get_data_from_wservice(data){
		if (data.trip_id) {
			if (data.rider_ind) {
				this.info_msg =C.MSG_PUBLISHED.replace('ROLE', 'Drivers');
				this.warning_msg 
					= ' You MUST maintain your balance over Estimated Cost. ' 
						+ 'Otherwise drivers cannot find your trip.' ;
			} else {
				this.info_msg =	C.MSG_PUBLISHED.replace('ROLE', 'Riders');
			}
			
			this.button_label='Publish Another Trip';
			this.Status.bookings_from_db	=	null;
		}
		else this.error_msg = C.ACTION_FAIL;
	}

	show_map(){
		console.debug('201810242001 TripComponent.show_map()');
		//this.communicationService.send_msg(C.MSG_KEY_MAP_BODY_SHOW, {});
		let pair = Util.deep_copy(this.trip);
		this.communicationService.send_msg(C.MSG_KEY_MARKER_CLEAR, {});
		this.communicationService.send_msg(C.MSG_KEY_MARKER_PAIR, pair);
		this.communicationService.send_msg(C.MSG_KEY_MARKER_FIT, pair);
		this.show_body=C.BODY_NOSHOW;
	};

	estimate_cost(){
		if (this.trip.distance == C.ERROR_NO_ROUTE) return '';
		return Math.round((this.form.value.price*this.trip.distance + C.BOOKING_FEE) 
			* this.form.value.seats*100)/100;
	}


	//validate_trip(fg: FormGroup): ValidationErrors | null {
	validate_form(): string|null {
		let validation_error=null;
		//console.debug('201811232324', this.class_name, 'validate_form() this.trip='
			//, C.stringify(this.trip));
		let f = this.form.value;
		if ( this.form_key == C.KEY_FORM_TRIP) {
			if ( this.user_from_db.balance == null ) {
				validation_error = 'Please sign in to post a trip' ;
			}
			else if ( !this.trip.p1.lat  )  {
				if (f.rider_ind) validation_error 			= 'Please enter Pickup Location';
				else if (!f.rider_ind) validation_error 	= 'Please enter Departure Location';
			}
			else if (!this.trip.p2.lat)  {
				if (f.rider_ind) validation_error 	= 'Please enter Dropoff Location';
				else if (!f.rider_ind) validation_error 	= 'Please enter Arrival Location';
			}
			else if ( this.trip.distance == C.ERROR_NO_ROUTE) 
				validation_error='Trip is not routable. Please fix it';
			else if ( f.rider_ind  && f.price> C.MAX_PRICE_RIDER ) 
				validation_error = 'Price must be less than ' + C.MAX_PRICE_RIDER;
			else if ( !f.rider_ind  && f.price> C.MAX_PRICE ) 
				validation_error = 'Price must be less than ' + C.MAX_PRICE;
			else if ( f.rider_ind  
					&& this.trip.distance != C.ERROR_NO_ROUTE
					&& this.user_from_db.balance < this.estimate_cost()
					) 
				validation_error 
					= 'You MUST maintain a balance above Estimated Cost to publish a trip as rider';
			else if ( this.user_from_db.balance < C.MIN_ACCOUNT_BALANCE )
				validation_error = 'You cannot publish trip with a negative account balance';
			else if ( !f.trip_time )
				validation_error = 'Please enter Departure Time';
		}

		else if (this.form_key == C.KEY_FORM_SEARCH )	{
			if ( ! this.trip.p1.lat )  {
				if (f.rider_ind) validation_error 	= 'Please enter Pickup Location';
				else if (!f.rider_ind) validation_error 	= 'Please enter Departure Location';
			}
			else if (!this.trip.p2.lat)  {
				if (f.rider_ind) validation_error 	= 'Please enter Dropoff Location';
			}
			else if (f.rider_ind && this.trip.distance == C.ERROR_NO_ROUTE) 
				validation_error = 'Trip not routable';
			else if (!f.date2 || f.date2=='') validation_error= 'Please enter date';
			else if (f.date2<f.date1) validation_error= 'Please enter valid date range';
			else if ( f.rider_ind  && f.price> C.MAX_PRICE_RIDER ) 
				validation_error = 'Price must be less than ' + C.MAX_PRICE_RIDER;
			else if ( !f.rider_ind  && f.price> C.MAX_PRICE ) 
				validation_error = 'Price must be less than ' + C.MAX_PRICE;
		}
		//console.debug('201811232324', this.class_name, 'validate_form() validation_error='
			//, validation_error
		return validation_error;
	}

	current_location()
	{
		let cl = this.mapService.current_loc
		if (! cl.lat) {
			this.current_location_msg='Location service is not enabled. Please try again';
			this.mapService.subscribe_geo_watcher();
		}
		else {
			this.current_location_msg=null;
			if(this.form.value.p1_loc==C.LOC_CURRENT1)
			{	
				this.form.patchValue ({
				p1_loc: C.LOC_CURRENT2
				});
			}
			else { 
				this.form.patchValue ({
					p1_loc: C.LOC_CURRENT1
				});
			}
		}
	}

	switch_loc()
	{
		this.form.patchValue ({
			p1_loc: this.form.value.p2_loc
			, p2_loc: this.form.value.p1_loc
		});
		let tmp= this.trip.p1;
		this.trip.p1 = this.trip.p2;
		this.trip.p2 = tmp;
	}

	set_time(minutes: number)
	{
		let [trip_date, trip_time] = Util.current_time_and_minutes(minutes);
		if( this.form_key==C.KEY_FORM_TRIP) {
			this.form.patchValue ({
				trip_date: trip_date,
				trip_time:	trip_time
			});
		}
		else  {
			this.form.patchValue ({
				date1: trip_date,
				date2: trip_date,
				trip_time:	trip_time
			});
		}	

	}


/*
  	mouseDown(event) {
			this.element = event.target;

			this.zone.runOutsideAngular(() => {
	  		window.document.addEventListener('mousemove', this.mouseMove.bind(this));
			});
	}

  	mouseMove(event) {
		event.preventDefault();
		//this.element.setAttribute('x', event.clientX + this.clientX + 'px');
		//this.element.setAttribute('y', event.clientX + this.clientY + 'px');
	}
*/

	// the getter is required for reactive form validation to work 
	get p1_loc		() { return this.form.get('p1_loc'	); }  
	get p2_loc		() { return this.form.get('p2_loc'	); }  
	get trip_date	() { return this.form.get('trip_date'	); }
	get trip_time	() { return this.form.get('trip_time'	); }
	get date1		() { return this.form.get('date1'	); }
	get date2		() { return this.form.get('date2'	); }
	get seats		() { return this.form.get('seats'		); }
	get price		() { return this.form.get('price'		); }
}
