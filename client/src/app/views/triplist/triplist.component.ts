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

	rider_criteria :any= null

    constructor( public changeDetectorRef       : ChangeDetectorRef
                , public mapService             : MapService
                , public communicationService   : CommunicationService
                , public dbService              : DBService
                , public geoService             : GeoService
                , public form_builder           : FormBuilder
                , public router                 : Router )  {
        super(changeDetectorRef,mapService, communicationService, dbService
                , geoService, form_builder, router );
  		console.debug("201809262245", this.class_name, ".constructor() enter")  ;

		this.trips_from_db = this.Util.deep_copy(this.Status.search_result);

  		console.debug("201809262245 JourneyComponent.constructor() this.trips_from_db=\n"
				, C.stringify(this.trips_from_db))  ;
		this.rider_criteria = this.Status.rider_criteria;

  		console.debug("201809262245", this.class_name, ".constructor() exit")  ;
  	} 

	ngoninit() {
		//this.subscription1 
			//= this.form.valueChanges.subscribe(data => console.log('Form value changes', data));
		//this.subscription2 
			//= this.form.statusChanges.subscribe(data => console.log('Form status changes', data));

		this.communicationService.send_msg(C.MSG_KEY_MARKER_CLEAR, {});

		if (this.trips_from_db.length==0) this.warning_msg='Nothing found'
		else this.info_msg='Found ' + this.trips_from_db.length; 

		for ( let index in this.trips_from_db) {
			let t = this.trips_from_db[index];

			if ( ! this.is_signed_in) t.status_msg = 'Please sign in';
			else if ( ! t.sufficient_balance ) t.status_msg = 'Insufficient<br/>balance';
			else t.status_msg=null ;


			t.show_book_button
				= 	this.is_signed_in 
					&& t.sufficient_balance
					&& Number(this.rider_criteria.distance);

			//this.Util.convert_book_to_pairs(j);


			t.google_map_url
				= MapService.google_map_string_from_points([
									 t.p1d
									, t.p1r 
									, t.p2r 
									, t.p2d 
					]);

		}
		this.communicationService.send_msg(C.MSG_KEY_MARKER_BOOKS, this.trips_from_db);
		this.mark_rider_pair();
  	}

	mark_rider_pair(){
		if(this.rider_criteria){
	    	let pair = this.Util.deep_copy ( this.rider_criteria);
			pair.p1.icon_type=PinIcon;
			pair.p2.icon_type=PinIcon;
			pair.line_color =C.MAP_LINE_COLOR_RIDER;
	    	this.communicationService.send_msg(C.MSG_KEY_MARKER_PAIR, pair);
		}
	}

	book(trip: any): void {
		let book_to_db = this.Util.deep_copy(this.rider_criteria);
		//this.Util.convert_pair_to_book(book_to_db);	

		book_to_db.trip_id = trip.trip_id ;
		let book_from_db_observable     = this.dbService.call_db(C.URL_BOOK, book_to_db);
		book_from_db_observable.subscribe(
	    	book_from_db => {
				console.debug("201808201201 JourneyComponent.book() book_from_db =" + C.stringify(book_from_db));
				if (book_from_db.status_cd=='P') trip.info_msg='Booked, pending<br/>confirmation' ;
				if (book_from_db.status_cd=='!P') trip.error_msg='Booking failed' ;
				trip.show_book_button= book_from_db.status_cd!='P';
				trip.seats_booked= trip.seats_booked
							+ book_from_db.seats;
				this.changeDetectorRef.detectChanges();
				
			},
			_ => {
				trip.info_msg=null;
				trip.error_msg='Booking failed';
				this.changeDetectorRef.detectChanges();
			}
		)
		
	}

	show_map(index: number){
		this.show_body =	C.BODY_NOSHOW;
		//this.communicationService.send_msg(C.MSG_KEY_MAP_BODY_SHOW, {});
		this.communicationService.send_msg(C.MSG_KEY_MARKER_CLEAR, {});
		this.communicationService.send_msg(C.MSG_KEY_MARKER_BOOKS, this.trips_from_db);

		let j = this.trips_from_db[index];
		//this.place_all_markers();
		C.convert_trip_to_pair(j);
		this.communicationService.send_msg(C.MSG_KEY_MARKER_FIT, j);
		//j.line_color = C.MAP_LINE_COLOR_HIGHLIGHT;
		j.line_weight = C.MAP_LINE_WEIGHT_HIGHLIGHT;
		this.communicationService.send_msg(C.MSG_KEY_MAP_LINE, j);
		this.mark_rider_pair();
	}
}
