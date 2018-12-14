// https://angular.io/guide/reactive-forms
// https://angular.io/guide/form-validation

import { Component} 						from '@angular/core';
import { HostListener } 					from '@angular/core';
//import { NgZone	} 						from '@angular/core';
import { ChangeDetectionStrategy } 			from '@angular/core';
import { ChangeDetectorRef } 				from '@angular/core';
import { FormControl } 						from '@angular/forms';
import { FormGroup } 						from '@angular/forms';
import { FormArray } 						from '@angular/forms';
import { FormBuilder } 						from '@angular/forms';
import { Validators } 						from '@angular/forms';
import { ValidatorFn } 						from '@angular/forms';
import { ValidationErrors } 				from '@angular/forms';
//import { AbstractControl} 				from '@angular/forms';
import { Subscription }						from 'rxjs';
//import { EventEmitter} 					from '@angular/core';
import { Input} 							from '@angular/core';
//import { Output} 							from '@angular/core';
import { Router				 }   			from '@angular/router';
import { SimpleChanges		  }   from '@angular/core';



import { AppComponent } 					from '../../app.component';
//import { Constants } 						from '../../models/constants';
import { C } 								from '../../models/constants';
import { BaseComponent } 					from '../base/base.component';
import { StorageService } 					from '../../models/gui.service';
import { Util } 							from '../../models/gui.service';
import { Status } 							from '../../models/gui.service';
import { CommunicationService} 			from '../../models/communication.service' ;
import { DBService} 						from '../../models/remote.service' ;
import { GeoService} 						from '../../models/remote.service' ;
import { MapService } 						from '../../models/map.service';

//import { UserService } 					from '../../models/gui.service';


@Component({
	selector	: 'app-booking'		,
	templateUrl	: './booking.component.html'	,
	styleUrls	: ['./booking.component.scss']	,
//	changeDetection: ChangeDetectionStrategy.OnPush ,	// prevent change detection unless @Input reference is changed
})

export class BookingComponent extends BaseComponent {
	@Input()
	booking_from_db: any; // one single booking or trip if no booking, {trip:... , book:...}

	@Input()
	index: number;

	b: any;
	bt: any;
	bb: any;

	constructor( public changeDetectorRef		: ChangeDetectorRef
				, public mapService			 	: MapService
				, public communicationService   : CommunicationService
				, public dbService				: DBService
				, public geoService				: GeoService
				, public form_builder			: FormBuilder
				, public router					: Router )  {
		super(changeDetectorRef,mapService, communicationService, dbService
				, geoService, form_builder, router );
		this.page_name=C.PAGE_BOOKING;
		console.debug("201812071208", this.page_name, 'this.booking_from_db= ', this.booking_from_db);

	} 

	ngoninit():void {
		this.b	=	this.booking_from_db;
		this.bt	=	this.booking_from_db.trip;
		this.bb	=	this.booking_from_db.book;
		this.setup_form();
		//window.scroll(0,Status.scroll_position[this.page_name]);

	}

	on_star_click() {
		let b = this.booking_from_db;
		let usr_id =	b.is_booker?b.trip.usr_id:b.book.usr_id	;
		this.router.navigate(['/reviews', usr_id]);	
	}

	action(action : string): void {
        this.reset_msg(); // remove msg and show it again, so fade would work
        this.changeDetectorRef.detectChanges(); // have to do this so fade would work
        this.call_wservice(action, this.form.value);
	}

	setup_form () : void {
		let bt= this.booking_from_db.trip;
		let bb= this.booking_from_db.book;
		this.form = this.form_builder.group({
				trip_id	: [bt.trip_id, []],
				book_id	: [bb?bb.book_id:'', []],
				seats	: [bt.seats, []],
				price	: [bt.price, []],
				}
			);
	}

	reset_button() : void{
		let b= this.booking_from_db;

		b.show_cancel_button=false;
		b.show_reject_button=false;
		b.show_confirm_button=false;
		b.show_finish_button=false;
		b.show_msg_button=false;
		b.show_review_button=false;
		b.show_delete_button=false;
	}

	set_button () : void{
		this.reset_button();

		let b = this.booking_from_db;

		if (b) {
			b.show_update_button 	= (! b.book && b.trip.status_cd=='A') ;
			b.show_delete_button 	= (! b.book && b.trip.status_cd=='A') ;
			let bb	= b.book;
			if (bb) {
				b.show_confirm_button 	= bb.status_cd == 'P' && ! b.is_booker ;
				b.show_reject_button	= bb.status_cd == 'P' && ! b.is_booker ;
				b.show_cancel_button	= bb.status_cd == 'C' || bb.status_cd == 'P' && b.is_booker;
				b.show_finish_button	= bb.status_cd == 'C' && b.is_rider ;
				b.show_msg_button 		= bb.status_cd == 'C';
				b.show_review_button	= bb.status_cd.match(/^(F|CD|CR)$/);
			}
		}
	}

	update(): void {
		this.reset_msg(); // remove msg and show it again, so fade would work
		this.changeDetectorRef.detectChanges() ;

		let booking_to_db = this.form.value;

		if ( booking_to_db.price== this.booking_from_db.trip.price
			&& booking_to_db.seats == this.booking_from_db.trip.seats)
		{
			this.info_msg=C.OK_NO_CHANGE ;
			this.changeDetectorRef.detectChanges() ;
			return;
		}
		this.call_wservice(C.URL_UPD_TRIP, booking_to_db);
	}

    on_get_data_from_wservice(data_from_db: any) {
		let n = data_from_db ; // new record
		let o = this.booking_from_db ;	//old record
		if (n.error) { 
			this.error_msg=n.error_desc;
		}
		else if (n.trip && n.trip.trip_id && n.trip.status_cd=='NB' ){ //delete action
			o.book_status_description 	= 'Deleted';	
			o.trip.status_cd 			= n.trip.status_cd;
		} 
		else if (n.trip && ! n.trip.trip_id){ //delete action failed
			this.error_msg=C.ACTION_FAIL;
		}
		else if ( n.trip_id	) { // trip seats and price change
			let t = this.booking_from_db.trip ;
			this.info_msg=C.OK_UPDATE;
			t.seats=n.seats;
			t.price=n.price;
		} 
		else if ( n.book && ! n.book.status_cd) { // get null from db
			this.error_msg=C.ACTION_FAIL;
		} 
		else if ( n.book && n.book.status_cd==o.book.status_cd) {
			// no status_cd change
			this.error_msg=C.ACTION_FAIL;
		} 
		else if ( n.book && n.book.status_cd != o.book.status_cd ) { // booking status change
			o.book.status_cd= n.book.status_cd;
			o.book_status_description= n.book_status_description;
			this.Status.tran_from_db = null; // clear trans history so data can be reload from db
		}
		else {
			this.error_msg='Unknow data from DB';
		}
		this.set_button();
		this.changeDetectorRef.detectChanges() ;
	}

	message(form: any, action : string): void {
		this.reset_msg(); // remove msg and show it again, so fade would work
		let b	=	this.booking_from_db;

		b.show_messaging_panel = !b.show_messaging_panel;
		if(b.show_messaging_panel) b.show_review_panel = false;
		this.changeDetectorRef.detectChanges();	
	}

	review(form: any, action : string): void {
		this.reset_msg(); // remove msg and show it again, so fade would work
		let b	=	this.booking_from_db;
		b.show_review_panel = !b.show_review_panel;
		if(b.show_review_panel) b.show_messaging_panel=false;
		this.changeDetectorRef.detectChanges();	
	}
	
	geo_mark() : void {
		this.router.navigate([C.ROUTE_MAP, C.ROUTE_MAP_ACTIVITIES, {index:this.index}]);
	}
}
