(function( $ ) {
/******************************************************************************************************************************************************
 * WP MEDIA INVOKER
 * ====================
 * This script allows you to invoke the wordpress media upload manager and select wanted image. It can be used for selecting images to sliders, theme options
 * and other custom wordpress scripts.
 *
 * @author Freshface
 ******************************************************************************************************************************************************/	
function wp_media_invoker( callback )  {
//####################################################################################################################################################
// TRANSLATIONS - you can edit this stuff;
//####################################################################################################################################################
	this.tr_use_image = 'Use this Image'; 	// the caption of the button
	this.tr_use_link = 'Use';				// this link appears at the top of the each image in media library
	
//####################################################################################################################################################
//	CSS selectors - you should not edit this :)
//####################################################################################################################################################
	this.tb_iframe = '#TB_iframeContent';			// ID of the thickbox iframe
	this.tb_link_class = '.thickbox';				// hyperlink class which invokes the thickbox
	this.tb_media_items_class = '#media-items';		// ID of the media items holder in the wordpress media item uploader
	this.tb_send_button = '.savesend'				// selector which contains the Use this button
	this.tb_tab_type_url = '#tab-type_url';			// Tab URL at the top menu
	this.tb_sidemenu = '#sidemenu';					// Top menu
	this.tb_savesend = '.savesend';					// Holder of the use this image button
//####################################################################################################################################################
//	Internal variables - do not edit this n00bs :D
//####################################################################################################################################################
	this.callback = callback;						// callback function, when image has been selected
	this.link_clicked = null;						// internal store, which identify the link from the dialogue has been called
	this.attr_name = 'media-upload-link';			// name of the attribute which identify the media upload links :)

	__this__ = this;								// just a copy of the object itself, because "this" is sometimes reserved to something special

	this.iframe_interval = null;					// DIRTY -> using the time interval detection to bound with the iframe
	this.upload_content_interval = null;			// DIRTY -> using the time interval detection to bound with the upload script
	
	this.tb_uploaded_items_count = 0;				// number of items which has been totally uploaded through the upload manager
	
	
	this.set_attr_name = function( attr_name ) {
		__this__.attr_name = attr_name;	
	}
	this.set_attr_selector = function( attr_selector) {
		__this__.tb_link_class = attr_selector;
	}
	
	/**
	 * When user click the media upload link, this script automatically detects the creation of the iframe and then create .load javascript event
	 */
	$(__this__.tb_link_class).live('click', function() {
		__this__.link_clicked = $(this).attr(__this__.attr_name);
		__this__.iframe_interval = setInterval( function() {
			if( $(__this__.tb_iframe).length > 0 ) {
				__this__.bind_methods();
				clearInterval( __this__.iframe_interval );
			}
		}, 30 );
	});
	
	/*
	 * This function bind the load method to the new loaded iframe. It's called every time after clicking the upload link :)
	 */
	this.bind_methods = function () {
		// bind the load function :)
		$(__this__.tb_iframe).load(function() {
			// disallow the URL user input
			$(__this__.tb_iframe).contents().find( __this__.tb_tab_type_url).css('display','none');
			// monitoring the switching between gallery and media upload
			$(__this__.tb_iframe).contents().find(__this__.tb_sidemenu).find('a').live('click', function() {
				__this__.null_values();		// null all important values
			});
			__this__.null_values();			// null them anyway :)
			
			// recognize which tab has been selected now 
			var sel_tab = __this__.get_selected_tab();
			if( sel_tab == 'upload') {
				__this__.bind_upload();
			}
			else if( sel_tab == 'library' ) {
				__this__.bind_functions_to_media_items();
			}
			
		});
	}
	
	/*
	 * This function cleans the interval for checking if some new images has been uploaded
	 */
	this.null_values = function() {
		clearInterval(__this__.upload_content_interval);
		__this__.tb_uploaded_items_count = 0;
	}
	
	/*
	 * This function is checking every 200 milliseconds, if there is new image upload, and then it bind's all the important functions to it
	 */
	this.bind_upload = function() {
		__this__.upload_content_interval = setInterval( function() {
			// run this function only when upload is selected
			if( __this__.get_selected_tab() == 'upload') {
				// number of currently uploaded items
				var media_items_count =  $(__this__.tb_iframe).contents().find(__this__.tb_media_items_class).find('.media-item').length;
				// if there is new item created, then re-bind all the functons
				if( media_items_count > 0 &&  media_items_count > __this__.tb_uploaded_items_count) {
					__this__.tb_uploaded_items_count++;
					__this__.bind_functions_to_upload();
				}
			} else {
				__this__.null_values();
			} 
		}, 200 ); 
	}
	
	/*
	 * User can upload big files, so we have to detect when the upload ends. With the interval ofcourse :)
	 */
	this.bind_functions_to_upload = function() {
		var save_button_interval = setInterval(function() {
			// after the upload ends, the form is generated automatically with the wordpress. So we check it :)
			if( $(__this__.tb_iframe).contents().find( __this__.tb_savesend ).length == __this__.tb_uploaded_items_count ) {
				__this__.bind_functions_to_media_items();
				clearInterval(save_button_interval);
			}
		},200);
		
	}
	/**
	 * This function renames the button values and add a quick button called std. "Use"
	 */
	this.bind_functions_to_media_items = function() {
		$(__this__.tb_iframe).contents().find('.savebutton').css('display','none');
		// re-name the buttons
		var send_buttons = $(__this__.tb_iframe).contents().find( __this__.tb_savesend ).find('input');
		send_buttons.attr('value', __this__.tr_use_image);
		
		// create new and only one click event to the use buttons
		send_buttons.unbind('click').click(function() {
			// send the image name
			__this__.send_button_click( $(this) );
		});
		// add quick use button
		$(__this__.tb_iframe).contents().find('.describe-toggle-on').after('<a class="toggle describe-toggle-on button-use-image" href="#">' + __this__.tr_use_link+ '</a>');
		$(__this__.tb_iframe).contents().find('.button-use-image').unbind('click').click( function() {
			// send the image name
			__this__.send_button_click( $(this) );
		});
	}
	
	/* 
	 * Call the callback function and end the thickbox
	 */
	this.send_button_click = function( send_button ) {
		// find the url of the image
		var url = send_button.parents('.media-item').find('.url').find('input').val();
		// call the callback function
		__this__.callback(url, __this__.link_clicked);
		// remove thickbox and null all important values
		__this__.remove_thickbox();
		return false;	
	}
	
	/**
	 * Manually remove thickbox, because wordpress does not allow you to call tb_close();
	 */
	this.remove_thickbox = function() {
		$('#TB_window, #TB_overlay').remove();
		__this__.link_clicked = null;
	}
	
	/**
	 * get the name of the selected tab
	 */
	this.get_selected_tab = function() {
		var sel_id = $(__this__.tb_iframe).contents().find( __this__.tb_sidemenu).find('.current').parent().attr('id');
		if( sel_id == 'tab-type')
			return 'upload';
		else if( sel_id == 'tab-type_url')
			return 'url';
		else if( sel_id == 'tab-library')
			return 'library';
	}
	
};	
  $.fn.attachMediaUploader = function( attr_name, callback) {
  	var selector = this.selector;
    this.mum = new wp_media_invoker( function( url, att_value) {
    	callback( url, att_value);
    });
    this.mum.set_attr_name( attr_name );
    this.mum.set_attr_selector(selector);
  };
})( jQuery );

