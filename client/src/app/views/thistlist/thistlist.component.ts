// https://angular.io/guide/reactive-forms
// https://angular.io/guide/form-validation

import { Component} from '@angular/core';
//import { OnInit } from '@angular/core';
//import { OnDestroy } from '@angular/core';
import { HostListener } from '@angular/core';
//import { NgZone  } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
//import { FormControl } from '@angular/forms';
//import { FormGroup } from '@angular/forms';
//import { FormArray } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
//import { Validators } from '@angular/forms';
//import { ValidatorFn } from '@angular/forms';
//import { ValidationErrors } from '@angular/forms';
//import { AbstractControl} from '@angular/forms';
//import { Subscription }   from 'rxjs';
import { Router				 }   from '@angular/router';


//import { EventEmitter} from '@angular/core';
import { Input} from '@angular/core';
//import { Output} from '@angular/core';

import {GeoService} from '../../models/remote.service' ;
import {DBService} from '../../models/remote.service' ;
import {CommunicationService} from '../../models/communication.service' ;
import { AppComponent } from '../../app.component';
//import { Constants } from '../../models/constants';
import { C } from '../../models/constants';
import { StorageService } from '../../models/gui.service';
//import { UserService } from '../../models/gui.service';
import { BaseComponent	  } from '../base/base.component' ;
import { MapService			 }   from '../../models/map.service';




@Component({
  selector	: 'app-thistlist'		,
  templateUrl	: './thistlist.component.html'	,
  styleUrls	: ['./thistlist.component.css']	,
  changeDetection: ChangeDetectionStrategy.OnPush ,  // prevent change detection unless @Input reference is changed
})

export class ThistlistComponent extends BaseComponent {
	// when *ngIf is true, both constructor() and ngOnInit() are called. constructor is called first then ngOnInit
	// the html needs  trip to populate its input fields. If trip==undefined, angular will keep calling constructor. 
	// By initialize trip to an empty structure, repeated calling of constructor can be avoided

	@Input()
	tran_from_db: any;
	tran_to_show: any;

	constructor( public changeDetectorRef		: ChangeDetectorRef
				, public mapService				: MapService
				, public communicationService   : CommunicationService
				, public dbService				: DBService
				, public geoService				: GeoService
				, public form_builder			: FormBuilder
				, public router					: Router )  {
		super(changeDetectorRef,mapService, communicationService, dbService
				, geoService, form_builder, router );
		this.page_name=C.PAGE_THIST_LIST;
  	} 

	ngoninit() {
		let form_value_from_storage =   StorageService.getForm(C.KEY_FORM_THIST_FILTER);

		if  (!form_value_from_storage)  {

			form_value_from_storage ={
					show_booking	:   true
				,	show_return		:   true
				,	show_penalty	:   true
				,	show_deposit	:   true
				,	show_withdraw   :   true
				,	show_earning	:   true
				,	show_pending	:   true
			};
			StorageService.storeForm(C.KEY_FORM_THIST_FILTER,  form_value_from_storage);
		}

		let fv=form_value_from_storage;

		this.form   =   this.form_builder.group({
			show_booking	:   [fv.show_booking,   []  ],
			show_return	 	:   [fv.show_return,	[]  ],
			show_penalty	:   [fv.show_penalty,   []  ],
			show_deposit	:   [fv.show_deposit,   []  ],
			show_withdraw   :   [fv.show_withdraw,  []  ],
			show_earning	:   [fv.show_earning,   []  ],
			show_pending	:   [fv.show_pending,   []  ],
		});
		this.form_change_action()
  	}

	form_change_action() {
		StorageService.storeForm(C.KEY_FORM_THIST,  this.form.value);
		this.tran_to_show=[];
		for (   let index   in  this.tran_from_db)  {
			let t = this.tran_from_db[index];
			if(this.show_filtered( t) ) this.tran_to_show.push(t);
		}
		this.changeDetectorRef.detectChanges();
	}

	show_filtered(tran: any):   boolean {
		console.debug("201810131007", this.page_name,  ".show_filtered()   tran.tran_cd="
			,   tran.tran_cd)   ;
		let fv 		=	this.form.value ;
		let status  =	false;
		if		(tran.tran_cd   =='P'   &&  fv.show_penalty	)   status=true;
		else if (tran.tran_cd   =='B'   &&  fv.show_booking	)   status=true;
		else if (tran.tran_cd   =='D'   &&  fv.show_deposit	)   status=true;
		else if (tran.tran_cd   =='W'   &&  fv.show_withdraw)   status=true;
		else if (tran.tran_cd   =='E'   &&  fv.show_earning	)   status=true;
		else if (tran.tran_cd   =='R'   &&  fv.show_return	)   status=true;
		//if (tran.actual_ts	==null  &&  fv.show_pending	)   status=true;

		return  status;
	}

}
