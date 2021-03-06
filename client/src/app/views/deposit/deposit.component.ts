import { Component } from '@angular/core';
//import { HostListener } from '@angular/core';
//import { NgZone	} from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
//import { FormControl } from '@angular/forms';
//import { FormGroup } from '@angular/forms';
//import { FormArray } from '@angular/forms';
//import { Validators } from '@angular/forms';
//import { ValidatorFn } from '@angular/forms';
//import { ValidationErrors } from '@angular/forms';
//import { AbstractControl} from '@angular/forms';
import { Subscription }	from 'rxjs';


import { EventEmitter, Input, Output} from '@angular/core';

import { FormBuilder 			}	from '@angular/forms';
import { Router				 }   from '@angular/router';
import { CommunicationService   }   from '../../models/communication.service' ;
import { DBService			  }   from '../../models/remote.service' ;
import { GeoService			 }   from '../../models/remote.service' ;
import { MapService			 }   from '../../models/map.service';

import { AppComponent } from '../../app.component';
import { C} 		from '../../models/constants';
//import { StorageService } from '../../models/gui.service';
import { UserService } from '../../models/gui.service';
import { BaseComponent }			from '../base/base.component';



@Component({
	selector	: 'app-deposit'			,
	templateUrl	: './deposit.component.html'	,
	styleUrls	: ['./deposit.component.css']	,
	changeDetection: ChangeDetectionStrategy.OnPush ,	// prevent change detection unless @Input reference is changed
})

export class DepositComponent extends BaseComponent {
	// when *ngIf is true, both constructor() and ngOnInit() are called. constructor is called first then ngOnInit
	// the html needs	trip to populate its input fields. If trip==undefined, angular will keep calling constructor. 
	// By initialize trip to an empty structure, repeated calling of constructor can be avoided

	user_from_db: any = {};
	show_detail = false;

	constructor( public changeDetectorRef   	: ChangeDetectorRef
				, public mapService			 : MapService
				, public communicationService   : CommunicationService
				, public dbService			  : DBService
				, public geoService			 : GeoService
				, public form_builder		   : FormBuilder
				, public router				 : Router )  {
		super(changeDetectorRef,mapService, communicationService, dbService
				, geoService, form_builder, router );
		console.debug("201809262245 DepositComponent.constructor() enter")	;
		this.page_name=C.PAGE_DEPOSIT;
		console.debug("201809262245 DepositComponent.constructor() exit")	;
	} 

	ngoninit() {
		this.warning_msg=C.WARN_NOT_SIGNED_IN;
		console.debug('201812241934', this.page_name, '.ngoninit() this.is_signed_in=', this.is_signed_in);
		if(this.is_signed_in) this.call_wservice(C.URL_GET_USER, {});
	}

	action(form: any, index: number, action : string): void {
		let data_from_db_observable	 = this.dbService.call_db(action, {});
		data_from_db_observable.subscribe(
				user_from_db => {
				console.debug("201810072326 DepositComponent.action() user_from_db =" 
					, C.stringify(user_from_db));
				this.user_from_db= user_from_db;

				if ( this.user_from_db.deposit_id != null)
				{
					this.user_from_db.deposit_id= this.user_from_db.deposit_id.replace(/-/g, ''); 
					this.show_detail=true;
				}
				else {
					this.warning_msg=C.WARN_NOT_SIGNED_IN;
				}
				this.changeDetectorRef.detectChanges() ;
			},
			error => {
				this.error_msg=error;
				this.changeDetectorRef.detectChanges() ;
			}
		)
	}

	subscription_action(msg){
		if (msg.msgKey==C.MSG_KEY_SIGNIN_STATUS_CHANGE) {
			console.debug('201812241934', this.page_name, 'subscription_action msg=', C.stringify(msg));
			this.call_wservice(C.URL_GET_USER, {});
		}
	}

	on_get_data_from_wservice(user_from_db:any) {
		this.user_from_db= user_from_db;

		if ( this.user_from_db.deposit_id != null)
		{
			this.user_from_db.deposit_id= this.user_from_db.deposit_id.replace(/-/g, ''); 
			this.show_detail=true;
			this.is_signed_in = true;
		}
		else {
			this.warning_msg=C.WARN_NOT_SIGNED_IN;
		}
		this.changeDetectorRef.detectChanges() ;
	}
}
