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
		selector	: 'app-review'
	,	templateUrl	: './review.component.html'
	,	styleUrls	: ['./review.component.scss']
	,	changeDetection: ChangeDetectionStrategy.OnPush
})

export class ReviewComponent extends BaseComponent {
	// when *ngIf is true, both constructor() and ngOnInit() are called. constructor is called first then ngOnInit
	// the html needs	trip to populate its input fields. If trip==undefined, angular will keep calling constructor. 
	// By initialize trip to an empty structure, repeated calling of constructor can be avoided

	@Input()
		book_id: string;

	@Input()
		index: number;

	//@HostListener('keydown', ['$event']) 

	review_from_db: any = {};

    constructor(  public changeDetectorRef      : ChangeDetectorRef
                , public mapService             : MapService
                , public communicationService   : CommunicationService
                , public dbService              : DBService
                , public geoService             : GeoService
                , public form_builder           : FormBuilder
                , public router                 : Router )  {
        super(changeDetectorRef,mapService, communicationService, dbService
                , geoService, form_builder, router );
	} 

	ngoninit() {
		this.set_form();
		this.call_wservice(C.URL_GET_REVIEW	,	this.form.value );
		this.warning_msg	=	' Loading ...' ;
		this.changeDetectorRef.detectChanges() ;
	}

	set_form(): void {
		if(! this.form) {
			this.form = this.form_builder.group({
				book_id	: [this.book_id, []],
				review	: [null, []],
				rating	: [null, []],
			});
		}
		if (this.review_from_db.review){
			this.form.patchValue ({
					reivew: this.review_from_db.review.review
				, 	rating: this.review_from_db.review.rating
			});
			
		}
		this.changeDetectorRef.detectChanges() ;
	}

	action(form: any, index: number, action : string): void {
		if(form.value.review.trim() === '' ) return ;
		this.call_wservice(action, form.value);
		this.warning_msg	=	' Saving ...' ;
		this.changeDetectorRef.detectChanges() ;
	}

	//override the same function in base
	on_get_data_from_wservice(review_from_db:any)
	{
		this.reset_msg();
		this.review_from_db = review_from_db;
		this.set_form();
	}
}
