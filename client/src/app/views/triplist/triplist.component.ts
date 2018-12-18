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
	index_being_booked: string ;

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

			t.show_book_button = 	this.is_signed_in && t.sufficient_balance
					&& t.seats_to_book >0 
					;

			let tmp_book= Util.deep_copy(t);
			tmp_book.book= sc;
			t.google_map_url = MapService.google_map_string(tmp_book); 
			t.stars = Util.get_stars(t.rating);

			t.enough_info = true;
			if ( !t.trip.rider_ind  && !sc.p1.lat  ) {
				// not enough info to make a booking, i.e. rider does not provide p1 p2
				t.enough_info = false; 
				t.warning_msg = 'Cannot book as rider. You must use Refine Search menu to search';
			}
			else if ( ! this.is_signed_in) 
				t.warning_msg = 'Cannot book. Please sign in';
			else if ( ! t.sufficient_balance && ! t.trip.rider_ind) 
				t.warning_msg = 'Cannot book. You have insufficient balance';
			else if ( ! t.sufficient_balance && t.trip.rider_ind) 
				t.warning_msg = 'Cannot book. You have negative balance';
		}

  	}
	
	reset_trip_msg(trip: any) {
		trip.info_msg= null;
		trip.error_msg= null;
		trip.warning_msg= null;
	}

	book(trip: any, index: string): void {
		this.reset_trip_msg(trip);
		this.changeDetectorRef.detectChanges();

		let seats = trip.trip.rider_ind? trip.trip.seats	:	this.search_criteria.seats	;
		let book_to_db = {
				  trip_id	:	trip.trip.trip_id
				, seats		:	seats
				, cost		:	trip.cost
				, p1		:	this.search_criteria.p1
				, p2		:	this.search_criteria.p2
				, distance	:	this.search_criteria.distance
				};

		this.index_being_booked = index;
		this.call_wservice(C.URL_BOOK, book_to_db);
	}

	on_get_data_from_wservice(data_from_wservice: any) {
		let b	= data_from_wservice; //booking from db
		let sr	= this.Status.search_result[this.index_being_booked];
		let t	= this.trips_from_db[this.index_being_booked];
		if (b.status_cd=='P') {
			t.info_msg='Booked, pending confirmation' ;
			t.show_book_button= false;
			t.seats_booked= t.seats_booked + b.seats;
			sr.seats_booked = sr.seats_booked + b.seats;
			t.seats_to_book= t.seats_to_book - b.seats;
			sr.seats_to_book = sr.seats_to_book - b.seats;
			this.Status.bookings_from_db	= null;
			this.Status.tran_from_db		= null;
			this.changeDetectorRef.detectChanges();
		}
		else t.error_msg='Booking failed' ;
	}

	show_map(index: number){
		this.router.navigate([C.ROUTE_MAP, C.ROUTE_MAP_SEARCH_RESULTES, {index:index}]);
	}
}
