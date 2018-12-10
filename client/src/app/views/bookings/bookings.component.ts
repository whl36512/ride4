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
	selector	: 'app-bookings'		,
	templateUrl	: './bookings.component.html'	,
	styleUrls	: ['./bookings.component.css']	,
//	changeDetection: ChangeDetectionStrategy.OnPush ,	// prevent change detection unless @Input reference is changed
})

export class BookingsComponent extends BaseComponent {
	@Input()
	bookings_from_db: any;

	filter : any;

	//@HostListener('keydown', ['$event']) 
	onAnyEvent(e) {
			 console.debug('201810131753 BookingsComponent.onAnyEvent() event=', e);
		}

	forms: any =[];

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


		console.debug("201809262245 BookingsComponent.constructor() enter")	;
	} 

	ngoninit():void {

		console.debug("201812071208", this.class_name
			,  ".ngoninit() Status.scroll_position[this.page_name]="
			, Status.scroll_position[this.page_name] )	;
		window.scroll(0,Status.scroll_position[this.page_name]);

	}

	ngonchanges(changes: SimpleChanges) {
		console.debug("201811260243", this.class_name,".ngonchanges() this.bookings_from_db = "
			, C.stringify(this.bookings_from_db) );

		let form_value_from_storage = StorageService.getForm(C.KEY_FORM_ACTIVITY_FILTER);

		if ( !form_value_from_storage ) {

			form_value_from_storage= {
				show_driver			 :   true
			,   show_rider			  :   true
			,   show_published  		:   true
			,   show_pending			:   true
			,   show_confirmed		  :   true
			,   show_rejected		   :   false
			,   show_canceled			:   false
			,   show_finished		   :   true
			};
		}


		let f= form_value_from_storage ;

		this.form = this.form_builder.group({
			show_driver			 : [f.show_driver, [] ]
		,   show_rider			  : [f.show_rider, [] ]
		,   show_published		  : [f.show_published, [] ]
		,   show_pending			: [f.show_pending, [] ]
		,   show_confirmed		  : [f.show_confirmed, [] ]
		,   show_rejected		   : [f.show_rejected, [] ]
		,   show_cancelled_by_driver: [f.show_cancelled_by_driver, [] ]
		,   show_cancelled_by_rider : [f.show_cancelled_by_rider, [] ]
		,   show_finished		   : [f.show_finished, [] ]
		});

		for ( let index in this.bookings_from_db) { // for.. in.. creates index, not object
			//let b = Util.convert_book_to_pairs(this.bookings_from_db[index]) ;
			let b = this.bookings_from_db[index] ;
			this.reset_msgs(index);
			this.reset_button(index);

			b.google_map_url = MapService.google_map_string(b) ;
			b.reviews_url	='/reviews/'+ b.other_usr_id
			b.stars = Util.get_stars(b.rating);
			this.add_form(b);
			this.set_button(index);
		}
		this.set_filter();
		
	}
	on_star_click(index: string) {
		let b = this.bookings_from_db[index];
		let usr_id =	b.is_booker?b.trip.usr_id:b.book.usr_id	;
		this.router.navigate(['/reviews', usr_id]);	
	}

	set_filter()
	{
		this.filter= this.form.value;
		StorageService.storeForm(C.KEY_FORM_ACTIVITY_FILTER, this.form.value);

		for ( let index in this.bookings_from_db) {
			this.bookings_from_db[index].show_booking
				=this.show_booking(this.bookings_from_db[index], Number(index));

		}
		// change this.bookings_from_db reference, so the bookings component can refresh
		this.changeDetectorRef.detectChanges();
	}

	show_booking(booking: any, index: number): boolean {
		let b = booking;
		let bb = booking.book;
		let f = this.filter ;
		console.debug("201810131007 BookingsComponent.show_this() booking.book.status_cd="
			, bb?bb.status_cd:null)	;
		console.debug("201810131007 BookingsComponent.show_this() index=", index)   ;
		console.debug("201810131007 BookingsComponent.show_this() this.filter"
			, f)  ;

		let status  =false;
		if (bb) {
			if	  	(bb.status_cd =='P' 	&& f.show_pending				) status=true;
			else if (bb.status_cd =='C' 	&& f.show_confirmed		  	) status=true;
			else if (bb.status_cd =='RD' 	&& f.show_rejected		  	) status=true;
			else if (bb.status_cd =='RR' 	&& f.show_rejected		  	) status=true;
			else if (bb.status_cd =='CD' 	&& f.show_cancelled_by_driver	) status=true;
			else if (bb.status_cd =='CPD' 	&& f.show_cancelled_by_driver	) status=true;
			else if (bb.status_cd =='CR' 	&& f.show_cancelled_by_rider 	) status=true;
			else if (bb.status_cd =='CPR' 	&& f.show_cancelled_by_rider 	) status=true;
			else if (bb.status_cd =='F' 		&& f.show_finished		   	) status=true;
		}
		else if	(f.show_published  			) status=true;

		let ret=false;
		if ( b.is_rider && f.show_rider && status) ret= true;
		else if ( ! b.is_rider && f.show_driver && status) ret= true;

		console.debug("201810131045 BookingsComponent.show_this() ret="+ ret)   ;

		return ret;
	}


	
	subscription_action ( msg: any): void{
	// overides BaseComponent.subscription_action
		//if (msg && msg.msgKey == C.MSG_KEY_MSG_PANEL) {

		if (msg.msgKey == C.MSG_KEY_MSG_PANEL) { //close msg panel
			let index = msg.body.index;
			let b = this.bookings_from_db[index] ;
			b.show_messaging_panel
				=msg.body.show_messaging_panel;
			this.reset_msgs(index);
			this.changeDetectorRef.detectChanges();
		}
		else {
			this.subscription_action_ignore
		}
	}

	add_form (book: any) : void {
		//console.debug("201810072302 BookingsComponent.add_form() book = " + C.stringify(book) );
		let bt= book.trip;
		let bb= book.book;
		let form = this.form_builder.group({
				trip_id	: [bt.trip_id, []],
				book_id	: [bb?bb.book_id:'', []],
				seats	: [bt.seats, []],
				price	: [bt.price, []],
				}
			);
		console.debug("201810072247 BookingsComponent.add_form() form="+ C.stringify(form.value));

		this.forms.push(form);
	}

	reset_msgs(index: string) : void{
		this.bookings_from_db[index].fail_msg=null;
		this.bookings_from_db[index].update_msg=null;
		super.reset_msg();
	}

	reset_button(index: string) : void{
		this.bookings_from_db[index].show_cancel_button=false;
		this.bookings_from_db[index].show_reject_button=false;
		this.bookings_from_db[index].show_confirm_button=false;
		this.bookings_from_db[index].show_finish_button=false;
		this.bookings_from_db[index].show_msg_button=false;
		this.bookings_from_db[index].show_review_button=false;
		this.bookings_from_db[index].show_delete_button=false;
	}

	set_button (index: string) : void{
		let b = this.bookings_from_db[index];
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

	update(form: any, index: string): void {
			console.debug("201809261901 BookingsComponent.update() form=" 
			, C.stringify(form.value) );
		this.reset_msgs(index); // remove msg and show it again, so fade would work
		this.changeDetectorRef.detectChanges() ;
		let booking_to_db = form.value;
		if ( booking_to_db.price== this.bookings_from_db[index].trip.price
			&& booking_to_db.seats == this.bookings_from_db[index].trip.seats)
		{
			this.bookings_from_db[index].update_msg=C.OK_NO_CHANGE ;
			this.changeDetectorRef.detectChanges() ;
			return;
		}

		//this.call_wservice(C.URL_UPD_TRIP, booking_to_db);
		let data_from_db_observable	 = this.dbService.call_db(C.URL_UPD_TRIP, booking_to_db);
		data_from_db_observable.subscribe(
				trip_from_db => {
					console.debug("201810072326 BookingsComponent.update() trip_from_db =" 
						, C.stringify(trip_from_db));

					let b = this.bookings_from_db[index] ;
					b.update_msg=C.OK_UPDATE;
					b.trip.seats=trip_from_db.seats;
					b.trip.price=trip_from_db.price;
					this.changeDetectorRef.detectChanges() ;
			},
			error => {
				this.error_msg=error;
				this.bookings_from_db[index].fail_msg='Action Failed';
				this.changeDetectorRef.detectChanges() ;
			}
		) ;
	}

	action(form: any, index: string, action : string): void {
		this.reset_msgs(index); // remove msg and show it again, so fade would work
		this.changeDetectorRef.detectChanges();	// have to do this so fade would work
			console.debug("201809261901 BookingsComponent.action() form=" 
			+ C.stringify(form.value) );
		let booking_to_db = form.value;

		//this.call_wservice(action, booking_to_db);
		let data_from_db_observable	 = this.dbService.call_db(action, booking_to_db);
		data_from_db_observable.subscribe(
			data_from_db => {
				console.debug("201811241702", this.class_name, '.action() data_from_db =' 
					, C.stringify(data_from_db));
				let n = data_from_db ; // new record
				let o = this.bookings_from_db[index] ;	//old record
				if(n.error) {
					o.fail_msg='ERROR: ' + n.error_desc;
				} else if (n.trip && n.trip.trip_id){ //delete action
					o.book_status_description = 'Deleted';	
					o.trip.status_cd = n.trip.status_cd;
				} else if (n.trip && ! n.trip.trip_id){ //delete action failed
					o.fail_msg=C.ACTION_FAIL;
				} else if ( n.book && n.book.status_cd==o.book.status_cd) {
					// no status_cd change
					o.fail_msg=C.ACTION_FAIL;
				} else if ( n.book && ! n.book.status_cd) { // get null from db
					o.fail_msg=C.ACTION_FAIL;
				} else {
					o.book.status_cd= n.book.status_cd;
					o.book_status_description= n.book_status_description;
					this.Status.tran_from_db = null;
				}
				this.set_button(index);
				this.changeDetectorRef.detectChanges() ;
			},
			error => {
				this.error_msg=error;
				this.bookings_from_db[index].fail_msg=C.ACTION_FAIL ;
				this.changeDetectorRef.detectChanges() ;
			}
		) ;
	}

	message(form: any, index: string, action : string): void {
		this.reset_msgs(index); // remove msg and show it again, so fade would work
		this.bookings_from_db[index].show_messaging_panel 
			= !this.bookings_from_db[index].show_messaging_panel;
		if(this.bookings_from_db[index].show_messaging_panel) 
			this.bookings_from_db[index].show_review_panel = false;
		this.changeDetectorRef.detectChanges();	
	}

	review(form: any, index: string, action : string): void {
		this.reset_msgs(index); // remove msg and show it again, so fade would work
		this.bookings_from_db[index].show_review_panel 
			= !this.bookings_from_db[index].show_review_panel;

		if(this.bookings_from_db[index].show_review_panel) 
			this.bookings_from_db[index].show_messaging_panel=false;
		this.changeDetectorRef.detectChanges();	
	}
	
	geo_mark(index: string) : void {

		this.router.navigate([C.ROUTE_MAP, C.ROUTE_MAP_ACTIVITIES, {index:index}]);
	}
}
