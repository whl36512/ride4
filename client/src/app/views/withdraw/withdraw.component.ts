// https://angular.io/guide/reactive-forms
// https://angular.io/guide/form-validation

import { Component } from '@angular/core';
//import { FormControl } from '@angular/forms';
//import { FormGroup } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { Router                 }   from '@angular/router';
import { Validators } from '@angular/forms';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import {AbstractControl,	ValidatorFn} from '@angular/forms';
import {EventEmitter, Input, Output} from '@angular/core';


//import {Usr} from '../../models/tables' ;
import {UserService} from '../../models/gui.service' ;
import {DBService} from '../../models/remote.service' ;
import {GeoService} from '../../models/remote.service' ;
import { MapService             }   from '../../models/map.service';
import {C} from '../../models/constants' ;
import {CommunicationService} from '../../models/communication.service' ;
import { AppComponent } from '../../app.component';
import { BaseComponent			} from '../base/base.component' ;





@Component({
	selector: 'app-withdraw',
	templateUrl: './withdraw.component.html',
	styleUrls: ['./withdraw.component.css'] ,
	changeDetection: ChangeDetectionStrategy.OnPush ,	// prevent change detection unless @Input reference is ch
})

export class WithdrawComponent extends BaseComponent {
	// when *ngIf is true, both constructor() and ngOnInit() are called. 
	// constructor is called first then ngOnInit
	// the html needs	user to populate its input fields. If user==undefined, angular will keep calling constructor. 
	// By initialize user to an empty structure, repeated calling of constructor can be avoided
	user_from_db: any ={}	; 

	saved : boolean = false;
	button_enabled	: boolean	= false;

	constructor( public changeDetectorRef	: ChangeDetectorRef 
                , public mapService             : MapService
                , public communicationService   : CommunicationService
                , public dbService              : DBService
                , public geoService             : GeoService
                , public form_builder           : FormBuilder
                , public router                 : Router )	{ 
		super(changeDetectorRef,mapService, communicationService, dbService
				, geoService, form_builder, router );
		this.page_name=C.PAGE_WITHDRAW;
	}

	ngoninit() {
		this.form = this.form_builder.group({
			usr_id: ['',	[]],	
			bank_email: ["",	[Validators.required, Validators.pattern]],	
			//requested_amount: [0,	[Validators.required]],
				//trnx_cd: ['W',	[Validators.required , Validators.min, Validators.max]],	
		});
		if(! this.is_signed_in) {
			this.warning_msg=C.WARN_NOT_SIGNED_IN ;
			return;
		}
		this.call_wservice(C.URL_GET_USER, {});
	}

	onSubmit() {
		this.reset_msg();
		this.call_wservice(C.URL_WITHDRAW, this.form.value);
	}

	form_change_action ()
	{
		this.button_enabled = 	this.form.valid 
							&& 	this.is_signed_in 
							&&	this.user_from_db 
							&& 	this.user_from_db.balance >0 ;
		this.changeDetectorRef.detectChanges();
	}

	
	on_get_data_from_wservice(data_from_db: any) { 
		let d = data_from_db;
		if(d.money_tran_id && d.requested_amount < 0 ) { //withdraw is a debit. So negative number
			this.saved=true;
			this.info_msg='Request sent. it will be reviewed and processed.';
		}
		else if ( d.member_since ) { // got usr
			this.form.patchValue ({usr_id: d.usr_id});
			this.user_from_db=d;
			this.is_signed_in = true;
		}
		this.changeDetectorRef.detectChanges();
	}
		
// the getter is required for reactive form validation to work 
get bank_email() { return this.form.get('bank_email'); }	
//get requested_amount () { return this.form.get('requested_amount'); }	
}
