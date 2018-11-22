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

	trip:any;
	step=1;
	button_label = 'Publish Trip';
	user_from_db: any = {};
	show_form	= C.BODY_SHOW;
	max_price	=C.MAX_PRICE;
	form_is_valid	=false;

	constructor( public changeDetectorRef   : ChangeDetectorRef
				, public mapService			 : MapService
				, public communicationService   : CommunicationService
				, public dbService			  : DBService
				, public geoService			 : GeoService
				, public form_builder		   : FormBuilder
				, public router				 : Router )  {
		super(changeDetectorRef,mapService, communicationService, dbService
				, geoService, form_builder, router );

		this.page_name= C.PAGE_TRIP;
  		console.log("201811011725", this.class_name, '.constructor() exit')  ;
  	} 

	ngoninit():void {
		this.setup_form();
		let data_from_db_observable	 = this.dbService.call_db(C.URL_GET_USER, {});
		data_from_db_observable.subscribe(
			user_from_db => {
				console.debug("201808201201 TripComponent.ngoninit() user_from_db =" 
					, C.stringify(user_from_db));
				this.user_from_db =user_from_db;
			},
			error => {
				this.error_msg=error;
				this.changeDetectorRef.detectChanges() ;
			}
		)
		this.changeDetectorRef.detectChanges() ;
	}

	setup_form()
	{

		let trip = StorageService.getForm(C.KEY_FORM_TRIP);
		if ( !trip ) {
			trip = this.Util.create_empty_trip();
		}
		console.debug("201810291814", this.class_name, ".ngOnInit() trip=",
			C.stringify(trip));
	
		trip.trip_date =  this.today > trip.trip_date ? this.today: trip.trip_date ;
	
		this.trip=trip;
		StorageService.storeForm(C.KEY_FORM_TRIP, trip);

		this.form= this.form_builder.group(
			{
				//sync validators must be in an array
				rider_ind			: [trip.rider_ind, [Validators.required]], 
				p1_loc				: [trip.p1.loc, [Validators.required]], 
				//start_lat	: ['', []],	 
				//start_lon	: ['', []],	 
				//start_display_name	: ['', []], 
				p2_loc				: [trip.p2.loc, [Validators.required]], 
				//end_lat			: ['', []], 
				//end_lon			: ['', []],
				//end_display_name	: ['', []],
				trip_date			: [trip.trip_date, [Validators.required, Validators.min]], 
				trip_time			: [trip.trip_time, [Validators.required]], 
				seats				: [trip.seats, [Validators.required]], 
				price				: [trip.price, [Validators.required]], 
				description			: [trip.description, ], 
			},	 
			{ 
				//validator		: this.validate_trip
			}
		);
	
		this.show_map();
  	}

	form_change_action(){
		this.reset_msg() ;
		let changed_field=this.form_loc_change_detect();
		if ( changed_field) this.geocode(changed_field, this.trip, this.form) ;
		this.validate_trip();
		this.changeDetectorRef.detectChanges() ;
	}

	onSubmit() {
		this.reset_msg() ;
			console.warn("201808201534", this.class_name, ".onSubmit() this.form.value=" 
			, C.stringify(this.form.value) );
		// save trip to db
		// combining data
		this.trip = { ...this.trip, ...this.form.value};
		this.trip.p1.loc = this.form.value.p1_loc;
		this.trip.p2.loc = this.form.value.p2_loc;
		delete this.trip.p1_loc;
		delete this.trip.p2_loc;
		StorageService.storeForm(C.KEY_FORM_TRIP, this.trip);

		let trip_to_db = Util.deep_copy( this.trip);
		// convert p1,p2, date1, date2 to column names in db 
		Util.convert_pair_to_trip(trip_to_db);

		let trip_from_db_observable	 = this.dbService.call_db(C.UPD_TRIP_URL, trip_to_db);
		trip_from_db_observable.subscribe(
				trip_from_db => {
					console.info("201808201201 TripComponent.constructor() trip_from_db =" 
						, C.stringify(trip_from_db));
					if (trip_from_db.trip_id) {
						this.form_saved_to_db=true;
						this.info_msg
							='The trip is published. Other users can start to book the trip.';
						if (trip_from_db.rider_ind) 
							this.warning_msg = ' You MUST maintain your balance over Estimated Cost. Otherwise othes cannot find your trip.'
						this.button_label='Publish Another Trip';
						this.changeDetectorRef.detectChanges() ;
					}
					else {
						if (trip_from_db.error_desc)
							this.error_msg = trip_from_db.error_desc + '. Request to publish rejected.' ;
						else
							this.error_msg ='Invalid data. Request to publish rejected.';
						this.changeDetectorRef.detectChanges() ;
					}
			},
			error => {
				this.error_msg=error;
				this.changeDetectorRef.detectChanges() ;
			}
		)
	}

	show_map(){
		console.debug('201810242001 TripComponent.show_map()');
		//this.communicationService.send_msg(C.MSG_KEY_MAP_BODY_SHOW, {});
		let pair = Util.deep_copy(this.trip);
		this.communicationService.send_msg(C.MSG_KEY_MARKER_CLEAR, {});
		this.communicationService.send_msg(C.MSG_KEY_MARKER_PAIR, pair);
		this.communicationService.send_msg(C.MSG_KEY_MARKER_FIT, pair);
	};

	estimate_cost(){
		if (this.trip.distance == C.ERROR_NO_ROUTE) return '';
		return Math.round((this.form.value.price*this.trip.distance + C.BOOKING_FEE) 
			* this.form.value.seats*100)/100;
	}


	//validate_trip(fg: FormGroup): ValidationErrors | null {
	validate_trip() {
		//console.debug('DEBUG 2018009080943 TripComponent.validate_trip() fg.value=\n' ) ; 
		//console.debug(fg.value ) ; 

		 if ( this.user_from_db.balance == null ) {
			this.error_msg = 'You must sign in to post a trip' ;
			this.form_is_valid= false;
		}
		else if ( this.form.value.rider_ind =='true' 
				&& this.trip.distance != C.ERROR_NO_ROUTE
				&& this.user_from_db.balance < this.estimate_cost()
				) {
			this.error_msg = 'Your balance is under Estimated Cost. You MUST maintain a balance above Estimated Cost to publish a trip as rider';
			this.form_is_valid= false;
			//return {balance: this.error_msg};
		}
		else if ( this.user_from_db.balance < 0)
		{ 
			this.error_msg = 'Your account balance is negative. You cannot publish trip with a negative balance';
			this.form_is_valid= false;
			//return {balance: this.error_msg};
		}
		else 
			this.form_is_valid= true;
	}

	current_location()
	{
		let cl = this.mapService.current_loc
		if (! cl.lat) this.error_msg='Location service is not enabled';
		else {
			this.form.patchValue ({
			p1_loc: cl.lat +',' + cl.lon
		});
		}
	}

	set_time(minutes: number)
	{
		let [trip_date, trip_time] = Util.current_time_and_minutes(minutes);
		this.form.patchValue ({
			trip_date: trip_date,
			trip_time:	trip_time
		});
		this.changeDetectorRef.detectChanges() ;
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
	get date1		() { return this.form.get('date1'	); }
	get date2		() { return this.form.get('date2'	); }
	get departure_time	() { return this.form.get('departure_time'	); }
	get seats		() { return this.form.get('seats'		); }
	get price		() { return this.form.get('price'		); }
}
