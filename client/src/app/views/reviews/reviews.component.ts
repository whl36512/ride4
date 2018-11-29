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
import { Router                 }   from '@angular/router';
import { ActivatedRoute                 }   from '@angular/router';


//import { EventEmitter} from '@angular/core';
import { Input} from '@angular/core';
//import { Output} from '@angular/core';

import {GeoService} from '../../models/remote.service' ;
import {DBService} from '../../models/remote.service' ;
import {CommunicationService} from '../../models/communication.service' ;
import { AppComponent } from '../../app.component';
//import { Constants } from '../../models/constants';
import { C } from '../../models/constants';
import { Util 				}	from '../../models/gui.service';
//import { StorageService } from '../../models/gui.service';
//import { UserService } from '../../models/gui.service';
import { BaseComponent      } from '../base/base.component' ;
import { MapService             }   from '../../models/map.service';




@Component({
  selector	: 'app-reviews'		,
  templateUrl	: './reviews.component.html'	,
  styleUrls	: ['./reviews.component.scss']	,
  changeDetection: ChangeDetectionStrategy.OnPush ,  // prevent change detection unless @Input reference is changed
})

export class ReviewsComponent extends BaseComponent {
	// when *ngIf is true, both constructor() and ngOnInit() are called. constructor is called first then ngOnInit
	// the html needs  trip to populate its input fields. If trip==undefined, angular will keep calling constructor. 
	// By initialize trip to an empty structure, repeated calling of constructor can be avoided

	STYLE1			={width: '1%'};
	usr_id 	:string	= null;			//reviewee
	user_from_db	:any	= {};  //reviewee
	reviews_from_db	:any	=null;
	rating_cnts				= [null, 0,0,0,0,0] ;  
	rating_pct				= [null, 0,0,0,0,0] ;
	rating_title			= [null, Util.get_stars(1), Util.get_stars(2), Util.get_stars(3)
								, Util.get_stars(4), Util.get_stars(5)] ;
	rating_style				= [null, this.STYLE1 ,this.STYLE1 ,this.STYLE1 ,this.STYLE1 ,this.STYLE1 ] ;
	total_cnt		:number	=	0	;
	total_rating	:number	=	0	;
	average_rating	:number	=	0;
	average_star	:string	=	'unrated';


    constructor( public changeDetectorRef   : ChangeDetectorRef
                , public mapService             : MapService
                , public communicationService   : CommunicationService
                , public dbService              : DBService
                , public geoService             : GeoService
                , public form_builder           : FormBuilder
                , public router                 : Router 
 				, public route: ActivatedRoute)  {
        super(changeDetectorRef,mapService, communicationService, dbService
                , geoService, form_builder, router );
		this.router.routeReuseStrategy.shouldReuseRoute = function() {
			// force recreate of component, so this.route.snapshot.paramMap.get will work
			return false;
		};
  	} 

	ngoninit() {
		this.usr_id = this.route.snapshot.paramMap.get('usr_id'); 
		this.call_wservice(C.URL_GET_OTHER_USER, {usr_id: this.usr_id});
		this.call_wservice(C.URL_GET_REVIEWS, {usr_id: this.usr_id});
  	}

    //override the same function in base
    on_get_data_from_wservice(data_from_db:any)
    {
        this.reset_msg();
		if	( data_from_db.usr_id) 	{ //got data from usr table for reviewee
			this.user_from_db	= data_from_db;	
		}
		else if ( data_from_db.length > 0) { // got data from review table
			this.reviews_from_db = data_from_db;
			//aggregate
			for (let index in this.reviews_from_db) {
				let r = this.reviews_from_db[index];
				r.stars =	Util.get_stars(r.rating);
				this.rating_cnts[r.rating] += 1;
				this.rating_cnts[0] += 1;
				this.total_cnt	+= 1 ;
				this.total_rating	+= r.rating ;
				this.rating_pct[r.rating] = Math.round(this.rating_cnts[r.rating]*1.0/this.total_cnt*100 );
				//to use with ngStyle. Must be a json object
				this.rating_style[r.rating]	= {width: String(this.rating_pct[r.rating]*0.3)+ '%' } 
			}
			this.average_rating = this.total_rating/this.total_cnt;
			this.average_star	= Util.get_stars(Math.round(this.average_rating));
			this.average_rating = Math.round(this.average_rating*10)/10.0 ;
	
		} 
    }

}
