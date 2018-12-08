// https://angular.io/guide/reactive-forms
// https://angular.io/guide/form-validation

import { Component, OnInit } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { NgZone  } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { FormArray } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { ValidatorFn } from '@angular/forms';
import { ValidationErrors } from '@angular/forms';
import { AbstractControl} from '@angular/forms';
import { Subscription }   from 'rxjs';

import { EventEmitter, Input, Output} from '@angular/core';
import { Router                 }   from '@angular/router';

import { AppComponent } from '../../app.component';
import { C } 			from '../../models/constants';
import { StorageService } from '../../models/gui.service';
import { UserService } from '../../models/gui.service';
import { Util 			} from '../../models/gui.service';
import { DotIcon } from '../../models/map.service';
import { PinIcon } from '../../models/map.service';
import { BaseComponent      } from '../base/base.component' ;
import { CommunicationService   }   from '../../models/communication.service' ;
import { DBService              }   from '../../models/remote.service' ;
import { GeoService             }   from '../../models/remote.service' ;
import { MapService             }   from '../../models/map.service';




@Component({
  selector	: 'app-trip'			,
  templateUrl	: './triplist.component.html'	,
  styleUrls	: ['./triplist.component.css']	,
  changeDetection: ChangeDetectionStrategy.OnPush ,  // prevent change detection unless @Input reference is changed
})

export class TriplistComponent extends BaseComponent {

    trips_from_db: any ;

	search_criteria :any= null

    constructor( public changeDetectorRef       : ChangeDetectorRef
                , public mapService             : MapService
                , public communicationService   : CommunicationService
                , public dbService              : DBService
                , public geoService             : GeoService
                , public form_builder           : FormBuilder
                , public router                 : Router )  {
        super(changeDetectorRef,mapService, communicationService, dbService
                , geoService, form_builder, router );
		this.page_name=C.PAGE_TRIP_LIST;


  		console.debug("201809262245", this.class_name, ".constructor() exit")  ;
  	} 

	ngoninit() {
		this.trips_from_db = this.Util.deep_copy(this.Status.search_result);

  		console.debug("201809262245 JourneyComponent.constructor() this.trips_from_db=\n"
				, C.stringify(this.trips_from_db))  ;
		this.search_criteria = this.Status.search_criteria;
		let sc = this.search_criteria;

		this.communicationService.send_msg(C.MSG_KEY_MARKER_CLEAR, {});

		if (this.trips_from_db.length==0) this.warning_msg='Nothing found'
		else this.info_msg='Found ' + this.trips_from_db.length; 

		for ( let index in this.trips_from_db) {
			let t = this.trips_from_db[index];

			if ( ! this.is_signed_in) t.status_msg = 'Please sign in';
			else if ( ! t.sufficient_balance && ! t.trip.rider_ind) t.status_msg = 'Insufficient<br/>balance';
			else if ( ! t.sufficient_balance && t.trip.rider_ind) t.status_msg = 'Negative<br/>balance';
			else t.status_msg=null ;

			t.show_book_button = 	this.is_signed_in && t.sufficient_balance
					&& t.seats_to_book >0
					;

			let tmp_book= Util.deep_copy(t);
			tmp_book.book= sc;
			t.google_map_url = MapService.google_map_string(tmp_book); 
			t.stars = Util.get_stars(t.rating);
		}

		window.scroll(0,	this.Status.scroll_position[this.page_name]);
  	}

	book(trip: any, index: string): void {

		let seats = trip.trip.rider_ind? trip.trip.seats	:	this.search_criteria.seats	;
		let book_to_db = {
				  trip_id	:	trip.trip.trip_id
				, seats		:	seats
				, cost		:	trip.cost
				, p1		:	this.search_criteria.p1
				, p2		:	this.search_criteria.p2
				, distance	:	this.search_criteria.distance
				};

		let book_from_db_observable     = this.dbService.call_db(C.URL_BOOK, book_to_db);
		book_from_db_observable.subscribe(
	    	book_from_db => {
				console.debug("201808201201 JourneyComponent.book() book_from_db =" + C.stringify(book_from_db));
				if (book_from_db.status_cd=='P') {
					trip.info_msg='Booked, <br/>pending<br/>confirmation' ;
					let sr= this.Status.search_result[index];
					trip.show_book_button= false;
					trip.seats_booked= trip.seats_booked + book_from_db.seats;
					sr.seats_booked = sr.seats_booked + book_from_db.seats;
					trip.seats_to_book= trip.seats_to_book - book_from_db.seats;
					sr.seats_to_book = sr.seats_to_book - book_from_db.seats;

					this.Status.bookings_from_db	= null;
					this.Status.tran_from_db		= null;
					this.changeDetectorRef.detectChanges();
				}
				else trip.error_msg='Booking failed' ;
			},
			error => {
				trip.info_msg=null;
				trip.error_msg=error;
				this.changeDetectorRef.detectChanges();
			}
		)
		
	}

	show_map(index: number){
		this.router.navigate([C.ROUTE_MAP, C.ROUTE_MAP_SEARCH_RESULTES, {index:index}]);
	}
}
