import { Component, OnInit } 	from '@angular/core';
import { OnDestroy } 		from '@angular/core';
import { Subscription }   	from 'rxjs';
import { ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder            }   from '@angular/forms';
import { Router             }   from '@angular/router';



import * as L from "leaflet";

import {DotIcon} 	from "../../models/map.service"
import {PinIcon} 	from "../../models/map.service"
import {C} 			from "../../models/constants"
import {Util} 		from "../../models/gui.service"
//import {DBService} 	from '../../models/remote.service' ;
import {Status} 	from "../../models/gui.service"
import { StorageService     } from '../../models/gui.service';
import { BaseComponent      } from '../base/base.component' ;
import { CommunicationService   }   from '../../models/communication.service' ;
import { DBService              }   from '../../models/remote.service' ;
import { GeoService             }   from '../../models/remote.service' ;
import { MapService             }   from '../../models/map.service';



@Component({
	selector: 'app-map-controller',
	templateUrl: './map-controller.component.html',
	styleUrls: ['./map-controller.component.css'],
	//providers: [CommunicationService],
	changeDetection: ChangeDetectionStrategy.OnPush , 
		
})

export class MapControllerComponent extends BaseComponent {
	region_search_criteria: any ;
	map_region: any ;  // for map movement detection
	map_move_time	: number; 
	search_is_running: boolean;
	map_is_moving:boolean ;

    constructor( public changeDetectorRef       : ChangeDetectorRef
                , public mapService             : MapService
                , public communicationService   : CommunicationService
                , public dbService              : DBService
                , public geoService             : GeoService
                , public form_builder           : FormBuilder
                , public router                 : Router )  {
        super(changeDetectorRef,mapService, communicationService, dbService
                , geoService, form_builder, router );

		this.region_search_criteria = {} ;
		this.map_region 			= {} ;
		this.map_move_time			= 0;
		this.search_is_running		= false
		this.map_is_moving			= true;
	}
		
	ngoninit() {
		//change class of the div#main to change style
		let element = document.getElementById("main");
    	if(element) element.classList.add("map-controller"); // for changing style

        let serach_criteria = StorageService.getForm(C.KEY_FORM_SEARCH) ;
		let sc	= serach_criteria;

		if (! sc || (sc.distance== C.ERROR_NO_ROUTE && sc.rider_ind=='true')
			||sc.version != C.VERSION_FORM_SEARCH) {
			this.router.navigate(['/Trip/'+ C.KEY_FORM_SEARCH]);
		}

		this.warning_msg = 'Please adjust map area to search for available trips' ;

		//move map viewport to contain rider_criteria
		let viewport= MapService.map_viewport_with_margin(sc, C.MAP_VIEWPORT_MARGIN);
        this.communicationService.send_msg(C.MSG_KEY_MARKER_FIT, viewport);

 		this.timer_sub = BaseComponent.timer.subscribe(
            // val will be 0, 1,2,3,...
            val => {
				//console.debug('201811041948', this.class_name, 'timer val=', val);
				if(val>2){ // avoid initial double search
					this.set_map_move(val);
					this.search();
				}
            },
        );
		Util.map_search_start();
		
		//Util.show_map();
	
		// resetting zoom not working.  It requires browser extension.
		// and it causes problem in android chrome when try to change z-index of the map.
		//let reset_zoom_var = Util.reset_zoom;
		//window.onresize = function(){ reset_zoom_var()};
		//window.addEventListener("resize", function(){reset_zoom_var()} );
	}

	
		
	search(){
		if (this.map_is_moving) {
			console.debug ('201810272312 MapControllerComponent.search() map is moving') ;
			return;
		}
		if (this.search_is_running) {
			console.debug ('201810272312 MapControllerComponent.search() search_is running') ;
			return;
		}
		if ( !Util.is_in_map_search()) {
			console.debug ('201810272312 MapControllerComponent.search() No Map searching.') ;
			return;
		}

		let region_search_criteria  = this.get_map_region();
		if (	this.region_search_criteria === region_search_criteria 	) return;

		console.debug ('201811041111 MapControllerComponent.search() perform map searching.') ;

		this.reset_msg();
        this.changeDetectorRef.detectChanges() ;
		this.warning_msg 			= 'Searching ...';
		this.search_is_running		= true;
		this.region_search_criteria = region_search_criteria;
		this.communicationService.send_msg(C.MSG_KEY_MARKER_CLEAR, {});
		
        this.changeDetectorRef.detectChanges() ;


        let search_criteria = StorageService.getForm(C.KEY_FORM_SEARCH) ;
		// region p1,p2 overwrite rider_criteria.p1,p2
		let search_criteria_combined = {...search_criteria, ... JSON.parse(region_search_criteria)};
		
		console.debug ('201810270146 MapControllerComponent.search() search_criteria_combined=\n'
					, search_criteria_combined);
		let data_from_db_observable     
			= this.dbService.call_db(C.URL_SEARCH, search_criteria_combined);
		
		data_from_db_observable.subscribe(
			trips_from_db => {
				this.reset_msg();
				this.changeDetectorRef.detectChanges() ;
				console.info("201808201201 MapControllerComponent.search() trips_from_db ="
						, C.stringify(trips_from_db));
				// save both search result and rider criteria at the same time
				// rider criteria will be used to determin the Book button in journey page
				this.Status.search_result= trips_from_db;
				this.Status.search_criteria= search_criteria;
				let rows_found = trips_from_db.length ;

				if(rows_found == 0 ) this.warning_msg = 'Nothing found in the map region';
				else if(rows_found >= C.MAX_SEARCH_RESULT ) 
					this.warning_msg = 'Found more than ' + C.MAX_SEARCH_RESULT 
						+ ' offers. Showing ' + C.MAX_SEARCH_RESULT
						+ '. <br/>Please adjust map area to found more relevant offers';
				else this.info_msg = `Found ${rows_found} offers.`
				this.changeDetectorRef.detectChanges() ;

				//this.mapService.try_mark_pairs(trips_from_db);
				this.mapService.mark_books(trips_from_db, null);
				let pair = Util.deep_copy(search_criteria);
				pair.line_color= C.MAP_LINE_COLOR_RIDER;
				this.mapService.try_mark_pair(pair);
				this.search_is_running= false ;
				console.debug ('201811041111 MapControllerComponent.search() finish map searching.') ;
			},
			error => {
				this.reset_msg();
				this.error_msg=error;
				this.search_is_running= false ;
				this.changeDetectorRef.detectChanges() ;
			}
		)
	}

	get_map_region(): any {
		let mr= {	  
				  box_p1:		{ 
							  //lat	:MapService.static_map.getBounds().getSouth()
							//, lon 	:MapService.static_map.getBounds().getWest()
							  lat	:this.mapService.map.getBounds().getSouth()
							, lon 	:this.mapService.map.getBounds().getWest()
						}
				, box_p2:		{ 
							  //lat	:MapService.static_map.getBounds().getNorth()
							//, lon 	:MapService.static_map.getBounds().getEast()
							  lat	:this.mapService.map.getBounds().getNorth()
							, lon 	:this.mapService.map.getBounds().getEast()
						}
			} ;
		return C.stringify(mr);
	}

	set_map_move(timer_count)
	{
		let mr = this.get_map_region();
		if (!  (mr == this.map_region)	) 
		{
			this.map_is_moving = true;
			this.map_region= mr;
			this.map_move_time =timer_count;
			console.debug ('201810272312 MapControllerComponent.search() map set to moving') ;
		}
		else if ( timer_count - this.map_move_time > 3) {
			this.map_is_moving= false;
		}
	}
		
	resize()
	{// not working
		//let height = window.innerHeight;
		//let width  = window.innerWidth;
		//document.getElementById("map").style.height = height + "px";
		//document.getElementById("map").style.width = height + "px";
	}

	onngdestroy()
	{
		Util.map_search_stop();
	//	this.mapService.map.off('moveend' );
		
		let element = document.getElementById("main");
    	if(element) element.classList.remove("map-controller");
		
	}
}
		
