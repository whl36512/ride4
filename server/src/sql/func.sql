\c ride


drop schema if exists funcs cascade;
create schema funcs ;
grant all on schema funcs to ride;
--grant all on all functions in schema funcs to ride;

create type funcs.criteria as
(
			rider_ind			boolean
		,	date1				date
		,	date2				date
		,	p1					location
		,	p2					location
		,	box_p1					location				-- bounding box
		,	box_p2					location				-- bounding box
		,	trip_date			date
		,	trip_time			time
		,	usr_id				uuid
		,	trip_id				uuid
		,	book_id				uuid
		,	oauth_id			text
		,	distance			decimal(8,2)
		,	price				ridemoney
		,	seats				integer
		,	deposit_id			uuid
		,	actual_amount	 	decimal
		,	ref_no				text
		,	search_tightness	integer
);

create type funcs.extended_criteria as
(		
		
		box_p1_lat	 			double precision
		, box_p2_lat			double precision
		, box_p1_lon			double precision
		, box_p2_lon			double precision
		-- box center
		, center_lat 			double precision
		, center_lon			double precision
		-- center box
		, p1_lat_cb				double precision
		, p2_lat_cb				double precision
		, p1_lon_cb				double precision
		, p2_lon_cb				double precision
		, diag_degree			double precision
		, seats					integer
		, max_price_driver		ridemoney
		, min_price_rider		ridemoney
		, min_dir				double precision
		, max_dir				double precision
		, min_dir_360			double precision
		, max_dir_360			double precision
		, min_dir_360_1			double precision
		, max_dir_360_1			double precision
		-- bigger the angle, narrower the sector
		, sin_dir_1 			double precision
		, cos_dir_1				double precision
		, sin_dir_2				double precision
		, cos_dir_2				double precision
		, rider_ind				boolean
		, trip_rider_ind		boolean
		, p1					location
		, p2					location
		, trip_date				date
		, trip_time				time
		, date1					date
		, date2					date
		, time1					time
		, time2					time
		, distance 				double precision
		, min_distance			double precision
		, max_distance			double precision
		, axes_move				double precision
		, margin_factor			ridemoney
)
;

create or replace function funcs.json_populate_record(base anyelement, in_text text )
	returns anyelement
as
$body$
-- if input json string has fields with "" value, change their value to null 
-- in order to avoid error when converting empty string to date
	select json_populate_record(base ,regexp_replace(in_text , '": ?""', '":null', 'g')::json) t ;
	--select json_populate_record(base ,regexp_replace(in_text , '": ?"[ \t]*"', '":null', 'g')::json) t ;
$body$
language sql;


create or replace function funcs.gen_error(error text, error_desc text )
	returns json
as
$body$
	select row_to_json(a) from (select error, error_desc) a
$body$
language sql;

create or replace function funcs.calc_cost(
	  p 		numeric 	-- price
	, d			numeric		-- distance
	, s 		integer	-- seats
	, OUT cost 	cost
	)
as
$body$
DECLARE
BEGIN
	cost.booking_fee		:=	0.2					;
	cost.margin_factor		:=	1.2					;
	cost.max_price_driver	:=	0.54				;
	cost.max_price_rider	:=	0.54 * cost.margin_factor	;
	cost.max_seats			:=	6					;

	cost.price_driver		:=	p				;
	cost.price_rider		:=	p * cost.margin_factor	;
	cost.cost_driver		:=	round(p			* d * s  , 2) ;
	cost.cost_rider			:=	round(cost.price_rider	* d * s  + cost.booking_fee * s , 2);
END
$body$
language plpgsql;

create or replace function funcs.calc_cost_driver(
-- calculate costs when driver is booker
	  p 		numeric 
	, d			numeric
	, s 		integer
	, OUT cost	cost
	)
as
$body$
DECLARE
BEGIN
	cost				:=	funcs.calc_cost(0,0,0)		;
	cost.price_rider	:=	p							;
	cost.price_driver	:=	p/cost.margin_factor	;
	cost.cost_rider		:=	round((cost.booking_fee + p * d) * s,2) ;
	cost.cost_driver	:=	round( p * s/cost.margin_factor  , 2) ;
END
$body$
language plpgsql;

create or replace function funcs.bearing(p1 location, p2 location, OUT bearing trip.dir%TYPE )
as
$body$
DECLARE
	lat1	 double precision;
	lat2	 double precision;
	lon1	 double precision;
	lon2	 double precision;
	dLon	 double precision;
	x		 double precision;
	y		 double precision;
	brng	 double precision; 	-- bearing
	--bearing	 decimal(6,2) ; -- bearing
	--bearing	 trip.dir%TYPE ; 	-- bearing
	--s0 RECORD ;
BEGIN
	--	SELECT * into s0 from funcs.json_populate_record(NULL::funcs.criteria, in_trip ) ;
	if p1.lat is null or p2.lat is null then bearing=null; end if;

	lat1	:=	p1.lat/360*2*pi();
	lat2	:=	p2.lat/360*2*pi();
	lon1	:=	p1.lon/360*2*pi();
	lon2	:=	p2.lon/360*2*pi();
	dLon	:=	lon2-lon1;

	y		:=	sin(dLon)* cos(lat2);
	x		:=	cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dLon);
	brng	:=	atan2(y,x);
	brng	:=	brng * 360 /(2*pi());
	bearing	:=	round(brng*100 + 36000)::integer % 36000;
	bearing	:=	360 - bearing/100.0	; -- counter clockwise
END
$body$
language plpgsql;

create or replace function funcs.get_usr( dummy text, in_user text)
	returns json
as
$body$
	SELECT row_to_json(u)
	from funcs.json_populate_record(NULL::usr, in_user) s0
	join usr u on ( u.usr_id= s0.usr_id);
$body$
language sql;

create or replace function funcs.upd_usr( data text, in_user text)
	returns json
as
$body$
DECLARE
	s0 usr; 
	u0 usr; 
	i1 usr ;
	--s1 RECORD ;
	u1 usr ;
BEGIN
	s0 := funcs.json_populate_record(NULL::usr, data) ;
	u0 := funcs.json_populate_record(NULL::usr, in_user) ;
	
	insert into usr ( oauth_id) 
		select	s0.oauth_id 
		where s0.usr_id is null and s0.oauth_id is not null
	on conflict on constraint uk_usr
	do nothing 
	returning * into i1
	;

	--select * into s1 from usr u where (u.usr_id=u0.usr_id or u.oauth_id=s0.oauth_id) ;

	update usr u
			set first_name			=coalesce(s0.first_name, u.first_name ) 
			, last_name				=coalesce(s0.last_name, u.last_name )
			, headline				=coalesce(s0.headline, u.headline) 
			, email					=coalesce(s0.email, u.email)
			, bank_email			=coalesce(s0.bank_email, u.bank_email)
			--, member_since 		=coalesce(s0.member_since, u.member_since)
			--, trips_posted		=coalesce(s0.trips_posted, u.trips_posted)
			--, trips_completed		=coalesce(s0.trips_completed, u.trips_completed)
			--, rating				=coalesce(s0.rating, u.rating)
			--, balance				=coalesce(s0.balance, u.balance)
			--, oauth_id			=coalesce(s0.oauth_id, u.oauth_id)
			--, oauth_host			=coalesce(s0.oauth_host, u.oauth_host)
			--, deposit_id			=coalesce(s0.deposit_id, u.deposit_id)
			, sm_link			 	=coalesce(s0.sm_link, u.sm_link)
			--, c_ts				=coalesce(s0.c_ts, u.c_ts)
			, m_ts					=coalesce(s0.m_ts, clock_timestamp())
			, profile_ind			=coalesce(s0.profile_ind, u.profile_ind)
	where 	u.usr_id=u0.usr_id 
	or 		u.oauth_id=s0.oauth_id
	returning u.* into u1
	;
				
	return row_to_json(u1);
END
$body$
language plpgsql;



create or replace function funcs.validate_trip( t0 trip)
	returns json
as
$body$
DECLARE
	--c0	funcs.criteria ;
	--t0	trip ;
	c	RECORD	;
BEGIN
	c	:=	funcs.calc_cost(0,0,0)	;
	
	if 		t0.rider_ind	is null	then return funcs.gen_error('201111211932','rider_ind is null');
	elsif t0.distance		<=	0	then return funcs.gen_error('201111211933','no route');
	elsif (t0.p1).lat		is null	then return funcs.gen_error('201111211933','no p1.lat');
	elsif (t0.p1).lon			is null	then return funcs.gen_error('201111211933','no p1.lon');
	elsif (t0.p1).display_name	is null	then return funcs.gen_error('201111211933','no p1.display_name');
	elsif (t0.p2).lat			is null	then return funcs.gen_error('201111211933','no p2.lat');
	elsif (t0.p2).lon			is null	then return funcs.gen_error('201111211933','no p2.lon');
	elsif (t0.p2).display_name	is null	then return funcs.gen_error('201111211933','no p1.display_name');
	elsif t0.trip_date			is null	then return funcs.gen_error('201111211933','no trip_date');
	elsif t0.trip_date 		< now()::date -1 then return funcs.gen_error('201111211933','trip_date is stale');
	elsif t0.trip_time		is null	then return funcs.gen_error('201111211933','no trip_time');
	elsif t0.price			is null	then return funcs.gen_error('201111211933','no price');
	elsif t0.price			<	0 	then return funcs.gen_error('201111211933','price <0');
	elsif t0.seats			is null	then return funcs.gen_error('201111211933','no seats');
	elsif t0.seats			<	1 	then return funcs.gen_error('201111211933','seats<1');
	elsif t0.seats			>	c.max_seats then return funcs.gen_error('201111211933','seats> max_seats');
	--elsif c0.date1 				is null					then return false;
	--elsif c0.date1 				< now()::date -1		then return false;
	--elsif t0.recur_ind 			is null					then return false;
	--elsif t0.day0_ind	 			is null					then return false;
	--elsif t0.day1_ind	 			is null					then return false;
	--elsif t0.day2_ind		 		is null					then return false;
	--elsif t0.day3_ind	 			is null					then return false;
	--elsif t0.day4_ind	 			is null					then return false;
	--elsif t0.day5_ind	 			is null					then return false;
	--elsif t0.day6_ind	 			is null					then return false;
	--elsif t0.recur_ind	and c0.date2 is null			then return false;
	--elsif t0.recur_ind	and c0.date2 <= c0.date1		then return false;
	--elsif t0.recur_ind	and c0.date2 > 	c0.date1+ 92 	then return false;
	--elsif t0.recur_ind and not t0.day0_ind and not t0.day1_ind and not t0.day2_ind 
					--and not t0.day3_ind and not t0.day4_ind and not t0.day5_ind 
					--and not t0.day6_ind 
	--then return false;
	elsif 		t0.rider_ind and t0.price	>	c.max_price_rider	then 
		return funcs.gen_error('201111211933','price> max_price_rider');
	elsif	not	t0.rider_ind and t0.price	>	c.max_price_driver	then	
		return funcs.gen_error('201111211933','price> max_price_driver');

	else	return null;
	end if;
END
$body$
language plpgsql;

create or replace function funcs.ins_trip( in_trip text, in_user text)
	returns json
as
$body$
DECLARE
	t0 trip ;
	u0 usr ;
	t1 trip ;
	validation_error json;
	dummy RECORD;
	cost RECORD;
BEGIN
	t0	:=	funcs.json_populate_record(NULL::trip, in_trip) ;
	select u.* into u0 from usr u, funcs.json_populate_record(NULL::usr , in_user) uu 
	where u.usr_id = uu.usr_id;

	if u0.usr_id is null then
		return funcs.gen_error('201811190902', 'user not signed in');
	end if;

	validation_error			:=	funcs.validate_trip(t0) ;
	if validation_error is not null then 
		return validation_error;
	end if;

	if t0.rider_ind then
		cost	:= funcs.calc_cost_driver(t0.price, t0.distance, t0.seats)	;
		if cost.cost_rider > u0.balance then
			return funcs.gen_error('201811202326'
				, 'Insufficient balance. Estimated cost for the trip is $'|| cost.cost_rider);
		end if;
	end if;

	t0.usr_id		:=	u0.usr_id;
	t0.dir 			:=	funcs.bearing(t0.p1, t0.p2);
	t0.trip_id		:=	uuid_generate_v4();
	t0.status_cd	:=	'A' ;
	t0.c_ts			:=	clock_timestamp();
	t0.m_ts			:=	clock_timestamp();

	insert into trip values( t0.*) returning * into t1 ;
	return row_to_json(t1);
END
$body$
language plpgsql;

create or replace function funcs.upd_trip( in_trip text, in_user text)
	returns json
as
$body$
DECLARE
	t0	RECORD ;
	t1	RECORD ;
	u0	RECORD ;
	c	RECORD	;
BEGIN
	t0	:=	funcs.json_populate_record(NULL::trip	, in_trip) ;
	u0	:=	funcs.json_populate_record(NULL::usr	, in_user) ;
	c	:=	funcs.calc_cost(0,0,0)	;	

	if u0.usr_id is null then
		return funcs.gen_error('201811190902', 'user not signed in');
	end if;

	update	trip t
	set 	seats = least(coalesce (t0.seats, t.seats), c.max_seats)
		,	price = least(coalesce (t0.price, t.price), c.max_price_driver)
	where 	t.trip_id	=	t0.trip_id
	and		t.usr_id	=	u0.usr_id
	and 	(t.seats != t0.seats or t.price!= t0.price)
	returning t.* into t1
	;

	return row_to_json(t1);
END
$body$
language plpgsql;

create or replace function funcs.ins_money_tran( 
		in_usr_id 			uuid
	,	in_actual_amount 	decimal
	,	in_tran_cd 			text
	,	in_ref_no 			text)
	returns money_tran
as
$body$
DECLARE
	m1	money_tran ;
	u1  usr	;
BEGIN
	if actual_amount is null then return null::money_tran ; end if;
	if actual_amount = 0 then return null::money_tran ;	end if;

	update usr u
	set balance = 	balance + actual_amount
	where	u.usr_id = in_usr_id
	returning u.* into u1
	;

	insert into money_tran ( 
		  usr_id
		, tran_cd
		, actual_amount
		, actual_ts 
		, ref_no
		, balance)
	select 
		  u1.usr_id
		, in_tran_cd
		, in_actual_amount
		, clock_timestamp()
		, in_ref_no
		, u1.balance
	returning m.* into m1
	;

	return m1;
END
$body$
language plpgsql;

create or replace function funcs.calc_penalty ( 
		new_status_cd text
	,	t trip
	,	b book
	,	OUT rider 	numeric
	,	OUT driver 	numeric
)
as
$body$
DECLARE
	trip_local_epoch		bigint	;
	utc_epoch				bigint	;
	timezone_offset			real	;
	hours_before_trip		real	;
	distance_time_factor	real	;
	c						RECORD	;
BEGIN
	c					:=	funcs.calc_cost(0,0,0)	;
	trip_local_epoch	:=	extract(epcho from (t.trip_date + t.trip_time ));
	utc_epoch			:=	extract(epcho from now());
	timezone_offset		:=	(b.p1).lon/15	;

	-- make sure hours_before_trip is always positive
	hours_before_trip 	:= greatest(0.1, (trip_local_epoch- utc_epoch)/3600.0 - timezone_offset + 1); 
	distance_time_factor:= round(least(1, sqrt(distance)/hours_before_trip)	* 	0.6*100/ 10) * 10.0 /100;

	driver	:=	0	;
	rider	:=	0	;
	if		new_status_cd	= 'CPD'	then
		driver	:=	c.booking_fee	;
	elsif	new_status_cd	= 'CPR'	then
		rider	:=	c.booking_fee	* b.seats 	;
	elsif	new_status_cd	= 'CD'	then
		driver	:=	b.cost_driver	* (distance_time_factor + 0.2)	; -- apply addition 20% penalty
	elsif	new_status_cd	= 'CR'	then
		rider	:=	c.booking_fee * b.seats 
					+ (b.cost_rider - c.booking_fee * b.seats)	* distance_time_factor;
	end if;
END
$body$
language plpgsql;

create or replace function funcs.cancel( in_book text, in_user text)
	returns json
as
$body$
DECLARE
	u0				usr ;
	u1				usr ;
	b0				book ;
	t0				trip ;
	b1				book ;
	ids				RECORD ;
	c				RECORD ;
	m1				RECORD ;
	new_status_cd	text;
	penalty 		RECORD;
BEGIN
	u0	:=	funcs.json_populate_record(NULL::usr 	, in_user)	; 
	c	:=	from funcs.clac_cost(0,0,0)	;

	SELECT b.* into b0	
	FROM book b, funcs.json_populate_record(NULL::trip	, in_book) b0 
	where b.book_id=b0.book_id	;

	select * into t0	from	trip t where t.trip_id	=	b0.trip_id	;

	new_status_cd	:=
		case 	
			when b0.rider_ind 	and b0.usr_id = u0.usr_id and b0.status_cd = 'P' then 'CPR' 
			when b0.rider_ind 	and b0.usr_id = u0.usr_id and b0.status_cd = 'C' then 'CR' 
			when t0.rider_ind 	and t0.usr_id = u0.usr_id and b0.status_cd = 'P' then 'RR' 
			when not b0.rider_ind 	and b0.usr_id = u0.usr_id and b0.status_cd = 'P' then 'CPD' 
			when not b0.rider_ind 	and b0.usr_id = u0.usr_id and b0.status_cd = 'C' then 'CD' 
			when not t0.rider_ind 	and t0.usr_id = u0.usr_id and b0.status_cd = 'P' then 'RD' 
			else 'ERROR 201811192123 invalid case'
		end;

	if new_status_cd like 'ERROR%' then 
		return funcs.gen_error('201811192123', 'invalid case');
	end if;

	penalty	:=	funcs.calc_penalty(new_status_cd, t0, b0);

	update	book b
	set 	status_cd			=	new_status_cd
		,	penalty_on_rider	=	penalty.rider
		,	penalty_on_driver	=	penalty.driver
		,	cancel_ts			=	clock_timestamp()
		,	m_ts				=	clock_timestamp()
	from 	trip t
	where	b.book_id	=	b0.book_id
	and		t.trip_id	=	b.trip_id
	and		u0.usr_id	in	( b.usr_id, t.usr_id) -- double check.
	and		b.status_cd	in 	( 'P', 'C')			-- must be in pending or confirmed state
	returning b.*, t.usr_id as trip_usr_id into b1
	;

	update 	trip
	set 	seats		=	least (seats + b1.seats. c.max_seats)
	where 	t.trip_id	=	b1.trip_id
	;

	-- return money to rider and apply penalty to rider or driver
	m1	:=	funcs.ins_money_tran(
	 		in_usr_id 			=> case when b1.rider_ind then b1.usr_id else b1.trip_usr_id end
		,	in_actual_amount 	=> b1.cost_rider
		,	in_tran_cd 			=> 'R'
		,	in_ref_no 			=> b1.book_id) ;
	m1	:=	funcs.ins_money_tran(
	 		in_usr_id 			=> case when b1.rider_ind then b1.usr_id else b1.trip_usr_id end
		,	in_actual_amount 	=> - b1.penalty_on_rider
		,	in_tran_cd 			=> 'P'
		,	in_ref_no 			=> b1.book_id) ;

	m1	:=	funcs.ins_money_tran(
	 		in_usr_id 			=> case when not b1.rider_ind then b1.usr_id else b1.trip_usr_id end
		,	in_actual_amount 	=> - b1.penalty_on_rider
		,	in_tran_cd 			=> 'P'
		,	in_ref_no 			=> b1.book_id) ;

	return row_to_json(b1);
END
$body$
language plpgsql;


create or replace function funcs.confirm( in_book text, in_user text)
	returns json
as
$body$
DECLARE
	u0	RECORD ;
	b0	RECORD ;
	b1	RECORD ;
BEGIN
	b0 := funcs.json_populate_record(NULL::book 	, in_book) ;
	u0 := funcs.json_populate_record(NULL::usr 		, in_user) ;

	if u0.usr_id is null then
		return funcs.gen_error('201811191940', 'user not signed in');
	end if;

	update 	book b
	set 		status_cd 	= 'C'
			,	confirm_ts	= clock_timestamp()
			,	m_ts		= clock_timestamp()
	from	trip t
	where 	b.book_id	= 	b0.book_id
	and 	t.trip_id	= 	b.trip_id
	and 	t.usr_id 	=	u0.usr_id	--double check. only offerer can confirm
	and		b.status_cd	= 	'P'			-- make sure the booking is pending confirmation
	returning b.* into b1
	;

	return row_to_json(b1);
END
$body$
language plpgsql;

create or replace function funcs.finish( in_book text, in_user text)
	returns json
-- mark the booking is complete to the satisfaction of rider
-- only ride can finish
as
$body$
DECLARE
	u0 RECORD ;
	b0 RECORD ;
	b1 RECORD ;
	t1 RECORD ;
	m1 RECORD ;
	driver_id	uuid;
	driver_earning	ridemoney;
BEGIN
	b0 := funcs.json_populate_record(NULL::book , in_book) ;
	u0 := funcs.json_populate_record(NULL::usr  , in_user) ;

	if u0.usr_id is null then
		return funcs.gen_error('201811191940', 'user not signed in');
	end if;

	update 	book b
	set 	status_cd 	= 'F'
			, m_ts		= clock_timestamp()
			, finish_ts	= clock_timestamp()
	from 	trip t
	where 	b.book_id	=	b0.book_id
	and		t.trip_id	= 	b.book_id
	and		b.status_cd	='C'		-- make sure the booking is in confirmed state
	and 	u0.usr_id in ( b.usr_id, t.usr_id) 	--double sure to defeat hacking
	returning b.* into b1
	;

	select t.* into t1
	from trip t
	where t.trip_id = b1.trip_id
	;

	update usr 
	set trips_completed =trips_completed	+ case when t.rider_ind then 1 else 0 end
	, 	rides_completed =rides_completed	+ case when t.rider_ind then 0 else 1 end
	where usr_id =  b1.usr_id
	;

	update usr 
	set trips_completed =trips_completed	+ case when t.rider_ind then 0 else 1 end
	, 	rides_completed =rides_completed	+ case when t.rider_ind then 1 else 0 end
	, 	trips_published =trips_published	+ case when t.rider_ind then 0 else 1 end
	, 	rides_published =rides_published	+ case when t.rider_ind then 1 else 0 end
	where usr_id =  t1.usr_id
	;

	-- assign money to driver
	m1	:=	funcs.ins_money_tran( 
			in_usr_id => case when t1.rider_ind then b1.usr_id else t1.usr_id end
			, in_actual_amount => b1.cost_driver
			, in_tran_cd => 'E'
			, in_ref_no => b1.trip_id) ;

	return row_to_json(b1);
END
$body$
language plpgsql;

create or replace function funcs.search( in_criteria text, in_user text)
	returns setof json
-- mark the booking is complete to the satisfaction of rider
-- only ride can finish
as
$body$
DECLARE
	cr funcs.extended_criteria ;
	u0 usr ;
	b0 RECORD ;
	b1 RECORD ;
	t1 RECORD ;
	m1 RECORD ;
	driver_id	uuid;
	driver_earning	ridemoney;
BEGIN
	SELECT		
		-- bounding box
		least		((t.box_p1).lat, (t.box_p2).lat) box_p1_lat	
		, greatest	((t.box_p1).lat, (t.box_p2).lat) box_p2_lat	
		, least		((t.box_p1).lon, (t.box_p2).lon) box_p1_lon
		, greatest	((t.box_p1).lon, (t.box_p2).lon) box_p2_lon	
		-- box center
		, ((t.box_p1).lat + (t.box_p2).lat)/2	center_lat 
		, ((t.box_p1).lon + (t.box_p2).lon)/2  	center_lon
		-- center box
		, ((t.box_p1).lat + (t.box_p2).lat)/2 - ((t.box_p2).lat-(t.box_p1).lat)/6 p1_lat_cb
		, ((t.box_p1).lat + (t.box_p2).lat)/2 + ((t.box_p2).lat-(t.box_p1).lat)/6 p2_lat_cb
		, ((t.box_p1).lon + (t.box_p2).lon)/2 - ((t.box_p2).lon-(t.box_p1).lon)/6 p2_lon_cb
		, ((t.box_p1).lon + (t.box_p2).lon)/2 + ((t.box_p2).lon-(t.box_p1).lon)/6 p2_lon_cb
		, sqrt(power( (t.box_p2).lat-(t.box_p1).lat,2) + power((t.box_p2).lon-(t.box_p1).lon, 2)) 
				diag_degree

		, coalesce(t.seats		, 1)				 				seats
		, coalesce(t.price/c.margin_factor , c.max_price_driver)	max_price_driver
		, coalesce(t.price*c.margin_factor , 0)						min_price_rider
		, funcs.bearing(t.p1, t.p2)- 43+4*search_tightness			min_dir
		, funcs.bearing(t.p1, t.p2)+ 43-4*search_tightness 			max_dir
		, funcs.bearing(t.p1, t.p2)- 43+4*search_tightness + 360	min_dir_360
		, funcs.bearing(t.p1, t.p2)+ 43-4*search_tightness + 360	max_dir_360
		, funcs.bearing(t.p1, t.p2)- 43+4*search_tightness - 360	min_dir_360_1
		, funcs.bearing(t.p1, t.p2)+ 43-4*search_tightness - 360	max_dir_360_1
		-- bigger the angle, narrower the sector
		, sin((funcs.bearing(t.p1, t.p2)-39-4*search_tightness)/360*2*pi())		sin_dir_1 
		, cos((funcs.bearing(t.p1, t.p2)-39-4*search_tightness)/360*2*pi())		cos_dir_1
		, sin((funcs.bearing(t.p1, t.p2)+39+4*search_tightness)/360*2*pi())		sin_dir_2
		, cos((funcs.bearing(t.p1, t.p2)+39+4*search_tightness)/360*2*pi())		cos_dir_2
		, t.rider_ind 
		, not t.rider_ind trip_rider_ind
		, t.p1
		, t.p2
		, t.trip_date
		, t.trip_time
		, t.date1
		, t.date2
		, time '0:0' 
			+ greatest (0		, extract (epoch from	coalesce(t.trip_time, time '00:00' ))
				- t.distance/60*3600+3600) * interval '1 second' time1
		, time '0:0' 
			+ least (3600*24-1 	, extract (epoch from	coalesce(t.trip_time, time '23:59' ))
				+ t.distance/60*3600+3600) * interval '1 second' time2
		, t.distance 								-- can be 0
		, t.distance /(3-0.2*search_tightness)		min_distance
		, t.distance *(4-0.2*search_tightness)		max_distance
		, t.distance* 1.0/60*(0.1+0.05*search_tightness)		axes_move
		, c.margin_factor
	FROM funcs.json_populate_record(NULL::funcs.criteria , in_criteria) t 
				, funcs.calc_cost(0.0,0.0,0)	c	
	into cr
	;

	SELECT u.* 
	INTO	u0
	FROM funcs.json_populate_record(NULL::usr , in_user) t 
		,	usr u
	where u.usr_id=t.usr_id
	;
	u0.usr_id := coalesce(u0.usr_id, uuid_generate_v4()) ;

	if not cr.rider_ind and (cr.p1).lat is not null and (cr.p2).lat is null then
		return query select * from funcs.search_region_no_p2(cr, u0);
	elsif cr.rider_ind and (cr.p1).lat is not null and (cr.p2).lat is not null then
		return query select * from funcs.search_region(cr, u0);
	elsif not cr.rider_ind and (cr.p1).lat is not null and (cr.p2).lat is not null then
		return query select * from funcs.search_region(cr, u0);
	else
		return query select * from funcs.gen_error('201811240942','Search criteria is ill formed');
	end if;
END
$body$
language plpgsql;

create or replace function funcs.search_region( in_criteria funcs.extended_criteria, in_user usr)
-- search by rider
	returns setof json
as
$body$
	with user0	as ( 
		-- if usr_id is null, populated it with random uuid
		SELECT coalesce(t.usr_id, uuid_generate_v4()) usr_id	
		FROM funcs.json_populate_record(NULL::usr , in_user) t 
	)
	, c0 as (
		SELECT		
			-- bounding box
			  least		((t.box_p1).lat, (t.box_p2).lat) box_p1_lat	
			, greatest	((t.box_p1).lat, (t.box_p2).lat) box_p2_lat	
			, least		((t.box_p1).lon, (t.box_p2).lon) box_p1_lon
			, greatest	((t.box_p1).lon, (t.box_p2).lon) box_p2_lon	
			, coalesce(t.seats		, 1)				 seats
			, coalesce(t.price/c.margin_factor , c.max_price_driver)	max_price_driver
			, funcs.bearing(t.p1, t.p2)- 43+4*search_tightness		min_dir
			, funcs.bearing(t.p1, t.p2)+ 43-4*search_tightness 		max_dir
			, funcs.bearing(t.p1, t.p2)- 43+4*search_tightness + 360	min_dir_360
			, funcs.bearing(t.p1, t.p2)+ 43-4*search_tightness + 360	max_dir_360
			, funcs.bearing(t.p1, t.p2)- 43+4*search_tightness - 360	min_dir_360_1
			, funcs.bearing(t.p1, t.p2)+ 43-4*search_tightness - 360	max_dir_360_1
			-- bigger the angle, narrower the sector
			, sin((funcs.bearing(t.p1, t.p2)-39-4*search_tightness)/360*2*pi())		sin_dir_1 
			, cos((funcs.bearing(t.p1, t.p2)-39-4*search_tightness)/360*2*pi())		cos_dir_1
			, sin((funcs.bearing(t.p1, t.p2)+39+4*search_tightness)/360*2*pi())		sin_dir_2
			, cos((funcs.bearing(t.p1, t.p2)+39+4*search_tightness)/360*2*pi())		cos_dir_2
			, t.p1
			, t.p2
			, t.date1
			, t.date2
			, time '0:0' 
				+ greatest (0		, extract (epoch from	coalesce(t.trip_time, time '00:00' ))
								- t.distance/60*3600+3600) * interval '1 second' time1
			, time '0:0' 
				+ least (3600*24-1 	, extract (epoch from	coalesce(t.trip_time, time '23:59' ))
								+ t.distance/60*3600+3600) * interval '1 second' time2
			, t.distance 
			, t.distance /(3-0.2*search_tightness)		min_distance
			, t.distance *(4-0.2*search_tightness)								max_distance
			, 1.0/60*(0.1+0.05*search_tightness)		axes_move
			, c.margin_factor
		FROM funcs.json_populate_record(NULL::funcs.criteria , in_criteria) t 
				, funcs.calc_cost(0.0,0.0,0)	c	
	)
	, a as (
		select 
			  t.p1
			, t.p2
			--, t.distance 
			, t.description
			, t.usr_id				
 			, t.trip_id				 
 			, t.trip_date		
 			, t.trip_time	
		--	, u.balance
			--, t.seats
			, (funcs.calc_cost(t.price, c0.distance , c0.seats )).cost_rider
			--, j.price*c0.margin_factor || ' per mile' price_rider
			, coalesce (b.seats,0) seats_booked
			, case when ur.balance >=	(funcs.calc_cost(t.price ,c0.distance	,c0.seats )).cost_rider
				then true else false 
				end sufficient_balance
			, case when ud.profile_ind then ud.sm_link else null end sm_link
			, ud.headline
			, c0.p1 p1_book
			, c0.p2 p2_book
		from trip t
		join user0 on (1=1)	-- usr0 may not be available because of not signed in
		join c0 on (1=1)
		join usr 	ud on (ud.usr_id=t.usr_id) -- to get driver's headline 
		left outer join usr ur on (ur.usr_id = user0.usr_id) -- to get bookings
		left outer join book b on (	b.usr_id = user0.usr_id
						and b.trip_id=t.trip_id
						and b.status_cd in ('P', 'C')
					)
		where t.usr_id	!= 	user0.usr_id
		and t.status_cd = 'A'
		and t.seats >= c0.seats
		and t.price <= c0.max_price_driver
		and t.trip_date between c0.date1 and c0.date2
		and t.trip_time between c0.time1 and c0.time2
		-- trip start and end must inside the bounding box
		and (t.p1).lat between c0.box_p1_lat and c0.box_p2_lat
		and (t.p1).lon between c0.box_p1_lon and c0.box_p2_lon
		and (t.p2).lat between c0.box_p1_lat and c0.box_p2_lat
		and (t.p2).lon between c0.box_p1_lon and c0.box_p2_lon
		and t.distance	between c0.min_distance and c0.max_distance
		and ( 	t.dir	 between c0.min_dir and c0.max_dir
				or	t.dir	 between c0.min_dir_360 and c0.max_dir_360
				or	t.dir	 between c0.min_dir_360_1 and c0.max_dir_360_1
			)
		-- this axes rotation is very rudimental. Needs refinement.
		and ((t.p2).lat	-(c0.p1).lat)*cos_dir_1 	- ((t.p2).lon	-(c0.p1).lon)	* sin_dir_1 
			> c0.distance*c0.axes_move
		and ((t.p2).lat	-(c0.p1).lat)*cos_dir_2	- ((t.p2).lon	-(c0.p1).lon)	* sin_dir_2 
				> c0.distance*c0.axes_move
		and ((t.p1).lat-(c0.p2).lat)*cos_dir_1 	- ((t.p1).lon-(c0.p2).lon)	* sin_dir_1 
				< - c0.distance*c0.axes_move
		and ((t.p1).lat-(c0.p2).lat)*cos_dir_2	- ((t.p1).lon-(c0.p2).lon)	* sin_dir_2 
				< - c0.distance*c0.axes_move
		order by t.trip_date, t.trip_time
		limit 100
	)
	select row_to_json(a) 
	from a
	;
$body$
language sql;

create or replace function funcs.search_region_no_p2( c0 funcs.extended_criteria , u0 usr)
-- search by driver. and drive does not provide p2
	returns setof json
as
$body$
DECLARE
BEGIN
	RETURN QUERY
	with a as (
		select 
			  t.p1	p1r
			, t.p2	p2r
			--, t.distance 
			, t.description
			, t.usr_id				
 			, t.trip_id				 
 			, t.trip_date		
 			, t.trip_time	
			, t.seats
			, funcs.calc_cost_driver(t.price, t.distance , t.seats ) as cost
			, ur.headline
			, c0.p1 p1d
			, c0.p2 p2d
			, t.rider_ind
		from trip t
		join usr ur on (ur.usr_id = t.usr_id) -- to get riders headline and balance
		where t.status_cd = 'A'
		--and t.usr_id	!= 	u0.usr_id
		and t.seats <= c0.seats
		and	t.rider_ind = c0.trip_rider_ind
		and t.price >= c0.min_price_rider
		and t.trip_date between c0.date1 and c0.date2
		and t.trip_time between c0.trip_time - sqrt(t.distance) *600 * interval '1 second' 
				and c0.trip_time +  sqrt(t.distance) *600 * interval '1 second'
		-- trip start must be near by and 
		-- end must be inside the bounding box
		and (t.p1).lat between (c0.p1).lat - t.distance/60/6 and (c0.p1).lat + t.distance/60/6
		and (t.p1).lon between (c0.p1).lon - t.distance/60/6 and (c0.p1).lon + t.distance/60/6
		and (t.p2).lat between c0.box_p1_lat and c0.box_p2_lat
		and (t.p2).lon between c0.box_p1_lon and c0.box_p2_lon
		and ur.balance >= (funcs.calc_cost_driver(t.price, t.distance , t.seats )).cost_rider
		order by t.trip_date, t.trip_time
		limit 100
	)
	select row_to_json(a) 
	from a
	;
END
$body$
language plpgsql;

--select * from funcs.search('{"departure_time": null, "distance": 30.7, "end_date": null, "end_display_name": "Millennium Centre, 33, West Ontario Street, Magnificent Mile, Chicago, Cook County, Illinois, 60654, USA", "end_lat": "41.89285925", "end_loc": "33 w ontario st, chicago", "end_lon": "-87.6292175246499", "price": 0.2, "seats": 1, "start_date": null, "start_display_name": "2916, Colton Court, Lisle, DuPage County, Illinois, 60532, USA", "start_lat": "41.7944060204082", "start_loc": "2916 colton ct", "start_lon": "-88.1075615306122"}');

create or replace function funcs.book( in_book text,	in_user text)
	returns json
as
$body$
DECLARE
		u0 RECORD ;
		b0 RECORD ;
		t0 RECORD ;
BEGIN
	u0 := funcs.json_populate_record(NULL::usr , in_usr) ;
	b0 := funcs.json_populate_record(NULL::book , in_book) ;
	SELECT * into t0 FROM trip where t0.trip_id = b0.trip_id;

	if u0.usr_id is null then
		return funcs.gen_error('201811190902', 'user not signed in');
	end if;

	if u0.usr_id = t0.usr_id then
		return funcs.gen_error('201811190902', 'offerer and booker cannot be the same');
	end if;

	if 		not t0.rider_ind and b0.rider_ind	then return funcs.book_rider	(in_book ,    in_user )	;
	elsif 	not b0.rider_ind and t0.rider_ind 	then return funcs.book_driver	(in_book ,    in_user )	;
	else 	return funcs.gen_error('201811190018', 'both are driver or rider');
	end if;
END
$body$
language plpgsql;
	
create or replace function funcs.book_rider( in_book text,	in_user text)
	returns json
as
$body$
DECLARE
		u0	RECORD ;
		b0	RECORD ;
		t0	RECORD ;
		u1	RECORD ;
		b1	RECORD ;
		m1	RECORD ;
		cost RECORD	;
BEGIN
	u0	:= funcs.json_populate_record(NULL::usr		, in_usr) ;
	b0	:= funcs.json_populate_record(NULL::book	, in_book) ;

	select * into t0	from trip t where t.trip_id = b0.trip_id ;
	select * into u1	from usr	where u.usr_id= u0.usr_id	;

	if b0.seats > t0.seats 
	then
		return funcs.gen_error('201811190020', 'Not enough seats');
	end if;


	cost 	:= funcs.calc_cost(t0.price , b0.distance , b0.seats )	;

	if cost.cost_rider > u1.balance
	then
		return funcs.gen_error('201811191824', 'Insufficeint balance');
	end if;

	insert into book (
    	trip_id
    ,   usr_id
    --,   rider_ind
    ,   p1
    ,   p2
    ,   distance
    ,   seats
    ,   price_driver
    ,   price_rider
    ,   cost_driver
    ,   cost_rider
    ,   status_cd   
	) values 
	(
		b0.trip_id
	,	b0.usr_id
	--,	b0.rider_ind
	,	b0.p1
	,	b0.p2
	,	b0.distance
	,	b0.seats
	,	cost.price_driver
	,	cost.price_rider
	,	cost.cost_driver
	,	cost.cost_rider
	,	'P'
	) 
	returning * into b1;

	update trip
	set seats	= seats - b1.seats
	where t.trip_id	=	b1.trip_id
	;

	select * into m1 from funcs.ins_money_tran( in_usr_id => b1.usr_id
										, in_actual_amount => - b1.cost_rider
										, in_tran_cd => 'B'
										, in_ref_no => b1.book_id) ;
	return row_to_json(b1);
END
$body$
language plpgsql;

create or replace function funcs.book_driver( in_book text,	in_user text)
	returns json
as
$body$
DECLARE
		u0	RECORD ;
		b0	RECORD ;
		t0	RECORD ;
		u1	RECORD ;
		b1	RECORD ;
		m1	RECORD ;
		cost RECORD;
BEGIN
	u0	:= funcs.json_populate_record(NULL::usr 	, in_usr) ;
	b0	:= funcs.json_populate_record(NULL::book 	, in_book) ;
	select * into t0	from trip t where t.trip_id = b0.trip_id ;
	select * into u1	from usr	where u.usr_id	= t0.usr_id	;		-- rider

	cost 	:= funcs.calc_cost_driver(t0.price , b0.seats )	;

	if b0.seats < t0.seats 
	then
		return funcs.gen_error('201811191857', 'driver has no enough seats');
	end if;

	if cost.cost_rider > u1.balance
	then
		return funcs.gen_error('201811191856', 'Rider has insufficeint balance');
	end if;

	insert into book (
    	trip_id
    ,   usr_id
    --,   rider_ind
    ,   p1
    ,   p2
    --,   distance
    ,   seats
    --,   price_offer
    --,   price_book
    ,   cost_rider
    ,   cost_driver
    ,   status_cd   
	) values 
	(
		b0.trip_id
	,	b0.usr_id
	--,	b0.rider_ind
	,	b0.p1
	,	b0.p2
	--,	b0.distance
	,	t0.seats		-- must cover all requested seats
	--,	cost.price_driver
	--,	cost.price_rider
	,	cost.cost_rider
	,	cost.cost_driver
	,	'P'
	) 
	returning * into b1;

	update trip
	set seats	= 0
	where t.trip_id	=	b1.trip_id
	;

	-- deduct rider's cost from his balance
	select * into m1 from funcs.ins_money_tran( in_usr_id => t0.usr_id
										, in_actual_amount => - b1.cost_rider
										, in_tran_cd => 'B'
										, in_ref_no => b1.book_id) ;
	return row_to_json(b1);
END
$body$
language plpgsql;


create or replace function funcs.get_money_tran( in_criteria text, in_user text)
	returns setof json
as
$body$
	with u0	as ( 
		SELECT * FROM funcs.json_populate_record(NULL::usr , in_user) 
	)
	, c0 as ( 
		SELECT * FROM funcs.json_populate_record(NULL::funcs.criteria , in_criteria)
	)
	, s1 as (select	
			coalesce(t.actual_ts, t.request_ts) date
			, cd.description
			, t.*
		from u0
		join money_tran t on ( t.usr_id= u0.usr_id)
		join	c0 on (1=1)	
		left outer join money_tran_tran_cd cd on (	cd.tran_cd = t.tran_cd)
		where (
			t.actual_ts between coalesce(c0.date1, '1970-01-01') 
			and coalesce(c0.date2, '3000-01-01')
			or 
			t.request_ts between coalesce(c0.date1, '1970-01-01') 
			and coalesce(c0.date2, '3000-01-01')
		)
	)
	select row_to_json (s1)	from s1
	order by date desc
	;
$body$
language sql;

create or replace function funcs.withdraw( in_tran text, in_user text)
	returns json
as
$body$
DECLARE
		t0 RECORD ;
		u0 RECORD ;
		t1 RECORD ;
BEGIN

	t0 := funcs.json_populate_record(NULL::money_tran	, in_tran) ;
	u0 := funcs.json_populate_record(NULL::usr			, in_user) ;

	insert into money_tran ( 
		  usr_id
		, tran_cd
		, requested_amount
		, request_ts
		, bank_email
		, ref_no	
		)
		values (
		  u0.usr_id
		, 'W'
		, -t0.requested_amount
		, clock_timestamp()
		, t0.bank_email
		, uuid_generate_v4()
		)
		returning * into t1
		;

		return row_to_json(t1);
END
$body$
language plpgsql;

create or replace function funcs.finish_withdraw( in_tran text, dummy text)
	returns json
as
$body$
DECLARE
		t0 RECORD ;
		t1 RECORD ;
BEGIN

	t0 := funcs.json_populate_record(NULL::money_tran, in_tran) ;

	update money_tran m
	set 	  actual_amount = -least(greatest(0,u.balance), -m.requested_amount)
			, actual_ts		= clock_timestamp()	
			, balance		=	u.balance - least(greatest(0,u.balance), -m.requested_amount)
	from 	usr u
	where 	u.usr_id=m.usr_id
	and		m.money_tran_id=t0.money_tran_id
	returning m.* into t1
	;

	update usr 
	set balance = balance + t1.actual_amount
	;

	return row_to_json(t1);
END
$body$
language plpgsql;

create or replace function funcs.deposit( tran text)
	returns json
as
$body$
DECLARE
		s0 funcs.criteria ;
		u0 usr ;
		m1 money_tran ;
BEGIN
	s0 := funcs.json_populate_record(NULL::funcs.criteria, tran) ;
	select * into u0 from usr u where u.deposit_id=s0.deposit_id;

	m1	:=	funcs.ins_money_tran(
	 		in_usr_id 			=> u0.usr_id
		,	in_actual_amount 	=> s0.actual_amount
		,	in_tran_cd 			=> 'D'
		,	in_ref_no 			=> s0.ref_no 
		);

	return row_to_json(m1);
END
$body$
language plpgsql;

create or replace function funcs.activity(in_criteria text, in_user text)
	returns setof json
as
$body$
DECLARE
	c0	funcs.criteria	;
	u0	usr				;
BEGIN
	c0	:= funcs.json_populate_record(NULL::funcs.criteria 	, in_criteria)	;
	u0	:= funcs.json_populate_record(NULL::usr 			, in_user)	;

	return QUERY
	with  ids as (
		select	t.trip_id, b.book_id, u0.usr_id my_usr_id, b.usr_id other_usr_id
		from	trip 	t 	
		join	book 	b	on (b.trip_id=t.trip_id )
		where	t.usr_id=	u0.usr_id 
		and	t.trip_date between coalesce(c0.date1	, '1970-01-01') 
							and coalesce(c0.date2	, '3000-01-01')
		-- join book_status s on (s.status_cd= b.status_cd)
		union
		select	t.trip_id, b.book_id, u0.usr_id my_usr_id, t.usr_id other_usr_id 
		from	book 	b 	
		join	trip 	t 	on ( t.trip_id 	= b.trip_id
								and	t.trip_date between coalesce(c0.date1	, '1970-01-01') 
											and coalesce(c0.date2	, '3000-01-01')
							)
		where	b.usr_id	= u0.usr_id
		union 
		-- get bookable trips to allow change of seats and price(cost)
		select	t.trip_id, null book_id, u0.usr_id my_usr_id, null other_usr_id
		from 	trip 	t 	
		where	t.usr_id=u0.usr_id 
		and		t.trip_date between coalesce(c0.date1	, '1970-01-01') 
		and 	coalesce(c0.date2	, '3000-01-01')
		and		t.status_cd='A'
		and		not t.rider_ind
		union 
		select	t.trip_id, null book_id, u0.usr_id my_usr_id, null other_usr_id
		from 	trip 	t 	
		where	t.usr_id=u0.usr_id 
		and		t.trip_date between coalesce(c0.date1	, '1970-01-01') 
		and 	coalesce(c0.date2	, '3000-01-01')
		and		t.status_cd='A'
		and 	t.seats>0			-- only show unbooked trip
		and		t.rider_ind		
	
	)
	, a as (
		select 
			  ids.trip_id
			, t.usr_id
			, ids.book_id
			, ids.my_usr_id
			, ids.other_usr_id
			, case when t.rider_ind then t.p1 else b.p1 end p1r
			, case when t.rider_ind then t.p2 else b.p2 end p2r
			, case when t.rider_ind then b.p1 else t.p1 end p1d
			, case when t.rider_ind then b.p2 else t.p2 end p2d
			, t.description
			-- , t.distance
			, t.trip_date
			, t.trip_time
			, b.status_cd
			, case when b.book_id is null	then t.price	else null end price
			, case 
				when t.usr_id	= ids.my_usr_id and t.rider_ind 		and b.book_id is not null 
					then (b.cost).cost_rider
				when t.usr_id	= ids.my_usr_id and not t.rider_ind 	and b.book_id is not null 	
					then (b.cost).cost_driver
				else null
			  end unified_cost -- either driver's cost or rider's cost
			, coalesce(b.seats , t.seats) seats	-- either seats available or seats booked
			, coalesce( bs.description, ts.description) status_description
			, case when t.usr_id = ids.my_usr_id then t.rider_ind 	else not t.rider_ind 	end rider_ind
			, case when t.usr_id = ids.my_usr_id then false 		else true 				end booker_ind
			, case when t.rider_ind and t.usr_id = ids.my_usr_id then uo.headline else null end headline_r
			, case when not t.rider_ind and t.usr_id = ids.my_usr_id then uo.headline else null end headline_d
			, case when t.rider_ind and t.usr_id = ids.my_usr_id then uo.sm_link else null end sm_link_r
			, case when not t.rider_ind and t.usr_id = ids.my_usr_id then uo.sm_link else null end sm_link_d
			, uo.sm_link	
			, coalesce(bs.description , 'Published') book_status_description
		from ids 
		join trip 				t 	on ( t.trip_id=ids.trip_id )
		join trip_status		ts 	on ( ts.status_cd=t.status_cd)
		left outer join usr				uo 	on ( uo.usr_id=ids.other_usr_id)
		left outer join book 	b 	on (b.book_id= ids.book_id )
		left outer join book_status bs 	on (bs.status_cd= b.status_cd)
	)
	
	select row_to_json(a) 
	from a
	order by a.trip_date , a.trip_time, a.status_cd nulls last
	;
END
$body$
language plpgsql;

create or replace function funcs.msgs(in_book text, in_user text)
	returns setof json
as
$body$
	with b0 as (
		SELECT * FROM funcs.json_populate_record(NULL::book , in_book)
	)
	, u0	as ( 
		SELECT * FROM funcs.json_populate_record(NULL::usr , in_user)
	)
	, a as (
		select m.*
			,	case when u0.usr_id = m.usr_id then 'Me'
				 	else 'They'
				 end user_is
		from u0
		join b0 on (1=1)
		join book b 	on ( b.book_id= b0.book_id ) 
		join msg m 	on ( m.book_id= b.book_id and m.c_ts > b0.c_ts )
	)
	select row_to_json(a) 
	from a
	order by a.c_ts 
	;
$body$
language sql;

create or replace function funcs.save_msg( in_msg text, in_user text)
	returns json
as
$body$
DECLARE
	m0 RECORD; 
	u0 RECORD ;
	m1 msg ;
	m2 RECORD ;
BEGIN
	m0 := funcs.json_populate_record(NULL::msg, in_msg) ;
	u0 := funcs.json_populate_record(NULL::usr, in_user) ;
	
	insert into msg ( book_id, usr_id, msg) 
		values	( m0.book_id, u0.usr_id, m0.msg)
	returning * into m1
	;

	return row_to_json(m1);
END
$body$
language plpgsql;
