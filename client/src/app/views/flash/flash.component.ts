// https://angular.io/guide/reactive-forms
// https://angular.io/guide/form-validation

import { Component} from '@angular/core';
import { OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { ValidatorFn } from '@angular/forms';
import { ValidationErrors } from '@angular/forms';
import { AbstractControl} from '@angular/forms';
//import { Subscription }	from 'rxjs';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { NgZone } from '@angular/core';
import { Router			 }   from '@angular/router';
import { ActivatedRoute			 }   from '@angular/router';


//import { EventEmitter, Input, Output} from '@angular/core';

import { GeoService} from '../../models/remote.service' ;
import { DBService} from '../../models/remote.service' ;
import { CommunicationService} from '../../models/communication.service' ;
import { AppComponent } from '../../app.component';
import { C} from '../../models/constants';
import { StorageService } from '../../models/gui.service';
import { Util } from '../../models/gui.service';
import { BaseComponent } from '../base/base.component' ;
import { MapService			 }   from '../../models/map.service';



@Component({
  selector	: 'app-flash'			,
  templateUrl	: './flash.component.html'	,
  styleUrls	: ['./flash.component.scss']	,
  // prevent change detection unless @Input reference is changed
  changeDetection: ChangeDetectionStrategy.OnPush ,  

})

export class FlashComponent extends BaseComponent {
	constructor( public changeDetectorRef   : ChangeDetectorRef
				, public mapService			 : MapService
				, public communicationService   : CommunicationService
				, public dbService			  : DBService
				, public geoService			 : GeoService
				, public form_builder		   : FormBuilder
				, public router				 : Router 
				, public route: ActivatedRoute)  {
		super(changeDetectorRef,mapService, communicationService, dbService
				, geoService, form_builder, router );
  	} 

	ngoninit():void {
	}

	start(){
		this.router.navigate(['/Trip/', C.KEY_FORM_SEARCH]);
	}
}
