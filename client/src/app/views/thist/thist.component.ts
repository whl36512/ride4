import	{	Component		}	from	'@angular/core';
import	{	ChangeDetectionStrategy	}	from	'@angular/core';
import	{ 	ChangeDetectorRef 		}	from '@angular/core';

import	{	AbstractControl	}	from	'@angular/forms';
import	{	Input			}	from	'@angular/core';
//import  {   FormControl }   from    '@angular/forms';
//import  {   FormGroup   }   from    '@angular/forms';
//import  {   FormArray   }   from    '@angular/forms';
import  {   FormBuilder }   from    '@angular/forms';
import  {   Validators  }		from    '@angular/forms';
//import  {   ValidatorFn }		from    '@angular/forms';
//import  {   ValidationErrors}   from    '@angular/forms';

import	{	AppComponent	}	from	'../../app.component';
import	{	C				}	from	'../../models/constants';
import	{	StorageService	}	from	'../../models/gui.service';
import	{	Status			}	from	'../../models/gui.service';
import	{	Util			}	from	'../../models/gui.service';
import	{	BaseComponent	}	from	'../base/base.component'	;


import { Router                 }   from '@angular/router';
import { CommunicationService   }   from '../../models/communication.service' ;
import { DBService              }   from '../../models/remote.service' ;
import { GeoService             }   from '../../models/remote.service' ;
import { MapService             }   from '../../models/map.service';


@Component({
		selector		:	'app-thist'
	,	templateUrl		:	'./thist.component.html'
	,	styleUrls		:	['./thist.component.css'] 
	,	changeDetection	:	ChangeDetectionStrategy.OnPush
})

export	class	ThistComponent	extends	BaseComponent	{
	tran_from_db	:	any	=	null	;
	filter			:	any			;

    constructor( public changeDetectorRef   : ChangeDetectorRef
                , public mapService             : MapService
                , public communicationService   : CommunicationService
                , public dbService              : DBService
                , public geoService             : GeoService
                , public form_builder           : FormBuilder
                , public router                 : Router )  {
        super(changeDetectorRef,mapService, communicationService, dbService
                , geoService, form_builder, router );

		console.debug("201809262245	ThistComponent.constructor()	enter")	;
		this.page_name=C.PAGE_THIST;
		console.debug("201809262245	ThistComponent.constructor()	exit")	;
	}


	ngoninit()	{
		let	form_value_from_storage	=	StorageService.getForm(C.KEY_FORM_THIST);
		
		if	(!form_value_from_storage)	{

			form_value_from_storage	={	
					date1			:	''
				,	date2			:	C.TODAY()
			};
        	StorageService.storeForm(C.KEY_FORM_THIST,  form_value_from_storage);
		}

		let fv=form_value_from_storage;
		
		this.form	=	this.form_builder.group({
			date1			:	[fv.date1,	[]],
			date2			:	[fv.date2,	[Validators.min]	],
		});

		this.tran_from_db = Status.tran_from_db;
	
		if( ! this.tran_from_db) this.form_change_action();
	}

    form_change_action() {
        let f= this.form.value;

        if(f.date2 && f.date2< f.date1) {
             this.form.patchValue ({
                date2: f.date1,
             });
        }

		this.reset_msg();
		this.warning_msg='Loading ...'	;
		this.tran_from_db	=	null	;	
		Status.tran_from_db	=	null	;	
		StorageService.storeForm(C.KEY_FORM_THIST,	this.form.value);	
		this.changeDetectorRef.detectChanges();

		this.call_wservice(C.URL_THIST,	this.form.value);
		
	}

    on_get_data_from_wservice(data_from_db: any) {
		this.reset_msg();
		this.tran_from_db	=	data_from_db	;	
		Status.tran_from_db	=	data_from_db	;	
        let len = data_from_db.length;
		this.info_msg =`Found ${len} transactions before filtering`;
		this.changeDetectorRef.detectChanges();
    }


    set_date(days: number) { // days is negative
        let [today, dummy1] = Util.current_time();
        let [next_days, dummy2] = Util.current_time_and_minutes(days*24*60);
        this.form.patchValue ({
            date1: next_days,
            date2: today,
        });
    }
}
