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
	,	changeDetection: ChangeDetectionStrategy.OnPush 	// prevent change detection unless @Input reference is changed
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
		console.debug("201809262245 ActivityComponent.constructor() enter")	;
		this.page_name=C.PAGE_ACTIVITY;
		console.debug("201809262245 ActivityComponent.constructor() exit")	;
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

		this.onChange();
	}

	onChange()
	{
		this.reset_msg();
		this.warning_msg='loading ...' ;
		this.changeDetectorRef.detectChanges();

		StorageService.storeForm(C.KEY_FORM_ACTIVITY, this.form.value); 

		this.bookings_from_db = [] ;	 //remove list of journeys
		let bookings_from_db_observable	
			= this.dbService.call_db(C.URL_ACTIVITY, this.form.value);
		bookings_from_db_observable.subscribe(
			bookings_from_db => {
				console.debug("201810071557 ActivityComponent.onChange() bookings_from_db ="
					 , C.stringify(bookings_from_db));
				this.reset_msg();
				this.bookings_from_db = bookings_from_db ;	
				if (this.bookings_from_db.length==0) this.warning_msg='Nothing found' ; 
				else this.info_msg =`Found ${this.bookings_from_db.length} activities.`	;
				this.changeDetectorRef.detectChanges();
			},
			error	=> { 
				this.reset_msg();
				this.error_msg= error;
				this.changeDetectorRef.detectChanges();
			}
		)
		
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


