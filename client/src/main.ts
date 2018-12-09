import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import { AppInjector } from './app/models/app-injector.service';

//import 'hammerjs';

if (environment.production) {
  enableProdMode();
	if(window){
		// disbale console in prod mode
    	window.console.log=function(){};
    	window.console.debug=function(){};
    	window.console.info=function(){};
    	window.console.error=function(){};
  }
}

//platformBrowserDynamic().bootstrapModule(AppModule)
  //.catch(err => console.log(err));

platformBrowserDynamic().bootstrapModule(AppModule).then((moduleRef) => {
        AppInjector.setInjector(moduleRef.injector);
    });        
