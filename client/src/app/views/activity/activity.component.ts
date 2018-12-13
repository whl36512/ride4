import { Component, OnInit } from '@angular/core';
import { OnDestroy } from '@angular/core';
import { NgZone	} from '@angular/core';
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
import { Subscription }	from 'rxjs';
import { Router                 }   from '@angular/router';

import { EventEmitter, Input, Output} from '@angular/core';

import { AppComponent } from '../../app.component';
import { C } from '../../models/constants';
//import { UserService } from '../../models/gui.service';
import { Status } from '../../models/gui.service';
import { Util } from '../../models/gui.service';
import { StorageService } from '../../models/gui.service';
import { BaseComponent } from '../base/base.component';
import { CommunicationService   }   from '../../models/communication.service' ;
import { DBService              }   from '../../models/remote.service' ;
import { GeoService             }   from '../../models/remote.service' ;
import { MapService             }   from '../../models/map.service';


@Component({
	selector: 'app-activity'
	,	templateUrl: './activity.component.html'
	,	styleUrls: ['./activity.component.css']
// prevent change detection unless @Input reference is changed
	,	changeDetection: ChangeDetectionStrategy.OnPush 	
})

export class ActivityComponent extends BaseComponent {
	bookings_from_db: any= [];

    constructor( public changeDetectorRef       : ChangeDetectorRef
                , public mapService             : MapService
                , public communicationService   : CommunicationService
                , public dbService              : DBService
                , public geoService             : GeoService
                , public form_builder           : FormBuilder
                , public router                 : Router )  {
        super(changeDetectorRef,mapService, communicationService, dbService
                , geoService, form_builder, router );
		this.page_name=C.PAGE_ACTIVITY;
	}


	ngoninit() {
		let form_value_from_storage = StorageService.getForm(C.KEY_FORM_ACTIVITY);
		if ( !form_value_from_storage ) {

			form_value_from_storage= {
				date1					:	C.TODAY()
			,	date2					:	''
			};
		}
		StorageService.storeForm(C.KEY_FORM_ACTIVITY, form_value_from_storage); 

		let f= form_value_from_storage ;
		
		this.form = this.form_builder.group({
			date1					: [f.date1, [Validators.min]]
		,	date2					: [f.date2, [Validators.min] ]
		});

		if ( !Status.bookings_from_db) {
			this.form_change_action();
		}	else {
			//this.info_msg ='Loaded from cache';
		}
		this.bookings_from_db = Status.bookings_from_db;
	}

	form_change_action() {
		let f= this.form.value;

		if(f.date2 && f.date2< f.date1) {
             this.form.patchValue ({
                date2: f.date1,
             });
		}
		this.reset_msg();
		this.warning_msg='loading ...' ;
	 	//remove list of journeys. detroy subpage and completely rebuild subpage after getting data
		this.bookings_from_db = null ;
		Status.bookings_from_db = null ;
		this.changeDetectorRef.detectChanges();

		let fv= this.form.value;	// make sure we get the updated value
		StorageService.storeForm(C.KEY_FORM_ACTIVITY, fv); 
		this.call_wservice(C.URL_ACTIVITY, fv);
	}

	on_get_data_from_wservice(data_from_db: any) {
		this.reset_msg();
		this.bookings_from_db = data_from_db ;	
		Status.bookings_from_db = data_from_db ;	

		let len = data_from_db.length;
		if (len==0) this.warning_msg='Nothing found' ; 
		//else this.info_msg =`Found ${len} activities.`	;
		this.changeDetectorRef.detectChanges();
	}


	set_date(days: number) {
		let [today, dummy1] = Util.current_time();
		let [next_days, dummy2] = Util.current_time_and_minutes(days*24*60);
        this.form.patchValue ({
            date1: today,
            date2: next_days,
        });
		//this.onChange();
	}
	

	subscription_action(msg): void {
		if (msg != undefined && msg != null && msg.msgKey == C.MSG_KEY_SHOW_ACTIVITY_BODY) {
			this.show_body = msg.show_body;
		}
		else {
			this.subscription_action_ignore();
		}

		
	}
}


