// https://angular.io/guide/reactive-forms
// https://angular.io/guide/form-validation

import { Component} from '@angular/core';
import { HostListener } from '@angular/core';
import { NgZone	} from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Input} from '@angular/core';
//import { Output} from '@angular/core';

import { AppComponent } from '../../app.component';
import { C } from '../../models/constants';
import { BaseComponent		} from '../base/base.component' ;

import { FormBuilder            }   from '@angular/forms';
import { Router                 }   from '@angular/router';
import { CommunicationService   }   from '../../models/communication.service' ;
import { DBService              }   from '../../models/remote.service' ;
import { GeoService             }   from '../../models/remote.service' ;
import { MapService             }   from '../../models/map.service';


@Component({
		selector	: 'app-message'
	,	templateUrl	: './message.component.html'
	,	styleUrls	: ['./message.component.css']
	,	changeDetection: ChangeDetectionStrategy.OnPush
})

export class MessageComponent extends BaseComponent {
	// when *ngIf is true, both constructor() and ngOnInit() are called. constructor is called first then ngOnInit
	// the html needs	trip to populate its input fields. If trip==undefined, angular will keep calling constructor. 
	// By initialize trip to an empty structure, repeated calling of constructor can be avoided

	@Input()
		book: any;

	@Input()
		index: number;

	//@HostListener('keydown', ['$event']) 

	msgs_from_db: any =[];

	// close message window after fixed time 
	msg_no_activity_count_down: number = C.MSG_NO_ACTIVITY_COUNT_DOWN; 

    constructor( public changeDetectorRef       : ChangeDetectorRef
                , public mapService             : MapService
                , public communicationService   : CommunicationService
                , public dbService              : DBService
                , public geoService             : GeoService
                , public form_builder           : FormBuilder
                , public router                 : Router )  {
        super(changeDetectorRef,mapService, communicationService, dbService
                , geoService, form_builder, router );
		this.page_name=C.PAGE_CHAT;

        this.subscribe_websocket();

        this.communicationService.ws_send(C.MSG_KEY_GREETING, `{"say":"Greeting from ${this.class_name}"}` ) ;

		console.debug("201809262245 MessageComponent.constructor() exit")	;
	} 

	timer_action(val:number)
	{
		if (this.component_destroyed ) return;
		if ( this.book.book_status!='C') return;

		if(val >0) {
			if ( val % ( 1000/C.TIMER_INTERVAL) == 0 ) { //show count down every second
				this.msg_no_activity_count_down -= 1;
				this.changeDetectorRef.detectChanges(); 
			}
		}
		if (this.msg_no_activity_count_down <=0 ) {
			this.communicationService.send_msg(C.MSG_KEY_MSG_PANEL
				, {index:this.index 
				, show_messaging_panel:false }
			);
		}
		else {
			if ( val > 10 && val % ( C.MSG_TIMER_WAIT*1000/C.TIMER_INTERVAL) == 0 ) {
				// subsequent load of new chats
				this.get_msgs_from_db();
			}
		}
	}

	ngoninit() {
		this.warning_msg	=	' Loading ...' ;
		this.get_form();
		this.get_msgs_from_db(); // initial load of chats
	}

	get_form(): void {
		this.form = this.form_builder.group({
				book_id	: [this.book.book_id, []],
				msg	: ['', []],
				p	: [null, []],
				}
			);
	}

    at_pickup() {
        this.subscribe_geo_getter();
        if (!this.geo_getter_sub) {
            this.error_msg='GPS not supported by the browser';
            return;
        }
        this.error_msg=null;
    }

    on_get_geo_pos(location){
		this.reset_msg();
		
        this.form.patchValue ({
            msg: C.MSG_AT_PICKUP,
        });

		this.action (this.form.value, 0, C.URL_SAVE_MSG);
    }

	action(form_value: any, index: number, action : string): void {
		this.reset_msg(); // remove msg and show it again, so fade would work
		this.msg_no_activity_count_down = C.MSG_NO_ACTIVITY_COUNT_DOWN ; // reset timer
		this.changeDetectorRef.detectChanges();	// have to do this so fade would work

		console.debug("201810182231 MessageComponent.action() form=" , C.stringify(form_value) );
		let msg_to_db = form_value;
		msg_to_db.p1 = this.current_loc;
		this.current_loc = null;  // so next msg will have to either get a new location or null location
		if(msg_to_db.msg.trim() === '' ) return ;
		
		//msg_to_db.book_id= this.book_id;

		let data_from_db_observable	 
			= this.dbService.call_db(C.URL_SAVE_MSG, msg_to_db);

		data_from_db_observable.subscribe(
			msg_from_db => {
				this.get_form(); // reset form
				msg_from_db.user_is='Me'; 
				this.add_geo(msg_from_db);
				this.msgs_from_db.push(msg_from_db);
				this.changeDetectorRef.detectChanges();
			},
			error => {
				this.error_msg=error;
				this.changeDetectorRef.detectChanges();
			}
		)
	}

	get_msgs_from_db(): void { // poll new msg from database
		this.reset_msg(); // remove msg and show it again, so fade would work
		this.changeDetectorRef.detectChanges();	// have to do this so fade would work

		var latest_c_ts = '1970-01-01';
		if ( this.msgs_from_db.length != 0) latest_c_ts = this.msgs_from_db[this.msgs_from_db.length-1].c_ts;
		let data_from_db_observable
			= this.dbService.call_db(C.URL_MSGS
				, {book_id: this.book.book_id, c_ts: latest_c_ts});
		data_from_db_observable.subscribe(
			msgs_from_db => {
				console.debug("201810072326 BookingsComponent.action() msg_from_db ="
					, C.stringify(msgs_from_db));

				if (msgs_from_db.length>0 ) {
					// reset timer if getting new messages
					this.msg_no_activity_count_down = C.MSG_NO_ACTIVITY_COUNT_DOWN;
					this.add_geos(msgs_from_db);
					this.msgs_from_db = this.msgs_from_db.concat(msgs_from_db);
				}
				this.changeDetectorRef.detectChanges();
			},
			error => {
				this.error_msg= error ;
				this.changeDetectorRef.detectChanges();
			}
		)
	}

	add_geo(msg) {
		if (msg.msg == C.MSG_AT_PICKUP && msg.p1 && msg.p1.lat && msg.p1.lon) {
			msg.google_map_string = MapService.google_map_string_from_points ([ msg.p1]); 
		}
		return msg;
	}

	add_geos(msgs) {
		for( let index in msgs) {
			this.add_geo(msgs[index]);
		}
	}
}
