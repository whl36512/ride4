\c ride


drop schema if exists funcs cascade;
create schema funcs ;
grant all on schema funcs to ride;
--grant all on all functions in schema funcs to ride;

create type funcs.criteria as
(
			date1				date
		,	date2				date
		,	p1					location
		,	p2					location
		,	rp1					location				-- rider pickup location
		,	rp2					location				-- rider dropoff location
		,	distance			decimal(8,2)
		,	trip_date			time
		,	trip_time			time
		,	usr_id				uuid
		,	trip_id				uuid
		,	trip_pid			uuid
		,	oauth_id			text
		,	price				ridemoney
		,	seats				integer
		,	deposit_id			uuid
		,	actual_amount	 	decimal
		,	reference_no		text
		,	search_tightness	integer
);

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
	  price 			numeric 
	, distance			numeric
	, seats 			integer
	, OUT booking_fee	numeric
	, OUT margin_factor	numeric
	, OUT price_driver	numeric
	, OUT price_rider 	numeric
	, OUT cost_driver	numeric	
	, OUT cost_rider	numeric
	, OUT max_price_driver	numeric
	, OUT max_price_rider	numeric
	, OUT max_seats		smallint
	)
as
$body$
DECLARE
BEGIN
	booking_fee		:=	0.2	;
	margin_factor	:=	1.2	;
	max_price_driver:=	0.54	;
	max_price_rider	:=	0.54 * booking_fee	;
	max_seats		:=	6

	price_driver	:=	price;
	price_rider		:=	price * margin_factor;
	cost_driver		:=	round(price			* distance * seats  , 2) ;
	cost_rider		:=	round(price_rider	* distance * seats  + booking_fee * seats , 2);
END
$body$
language plpgsql;

create or replace function funcs.calc_cost_driver(
-- calculate costs when driver is booker
	  in_cost_rider		numeric 
	, in_seats 			integer
	, OUT cost_driver	numeric	
	, OUT cost_rider	numeric)
as
$body$
DECLARE
	const RECORD;
BEGIN
	const				:=	funcs.calc_cost(0,0,0)
	cost_rider			:=	in_cost_rider	;
	cost_driver		
		:=	greatest(0, round( (in_cost_rider- const.booking_fee*in_seats)/const.margin_factor  , 2)) ;
END
$body$
language plpgsql;

create or replace function funcs.bearing2(p1 location, p2 location, OUT bearing trip.dir%TYPE )
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

create or replace function funcs.get_user( dummy text, in_user text)
	returns usr
as
$body$
	SELECT u.* 
	from funcs.json_populate_record(NULL::usr, in_user) s0
	join usr u on ( u.usr_id= s0.usr_id);
$body$
language sql;

create or replace function funcs.updateusr( data text, in_user text)
	returns usr
as
$body$
DECLARE
	s0 RECORD; 
	u0 RECORD; 
	i1 RECORD ;
	s1 RECORD ;
	u1 RECORD ;
BEGIN
	SELECT * into s0 from funcs.json_populate_record(NULL::usr, data) ;
	SELECT * into u0 from funcs.json_populate_record(NULL::usr, in_user) ;
	
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
				
	return u1;
END
$body$
language plpgsql;



create or replace function funcs.validate_trip( in_trip text)
	returns boolean
as
$body$
DECLARE
	c0	funcs.criteria ;
	t0	trip ;
	c	RECORD	;
BEGIN
	SELECT * into c0	FROM funcs.json_populate_record(NULL::funcs.criteria	, in_trip) ;
	SELECT * into t0	FROM funcs.json_populate_record(NULL::trip				, in_trip) ;
	c	:=	funcs.calc_cost(0,0,0)	;	;
	--in_trip has both dat1, date 2 and start_date , end_date
	
	if t0.distance			<=	0					then return false; end if;
	if (c0.p1).lat			is null					then return false; end if;
	if (c0.p1).lon			is null					then return false; end if;
	if (c0.p1).display_name	is null					then return false; end if;
	if (c0.p2).lat			is null					then return false; end if;
	if (c0.p2).lon			is null					then return false; end if;
	if (c0.p2).display_name	is null					then return false; end if;
	if t0.trip_date			is null					then return false; end if;
	if t0.trip_time			is null					then return false; end if;
	if t0.price				is null					then return false; end if;
	if t0.price				<	0 					then return false; end if;
	if t0.price				>	c.max_price_driver	then return false; end if;
	if t0.seats				is null					then return false; end if;
	if t0.seats				<	1 					then return false; end if;
	if t0.seats				>	c.max_seats 		then return false; end if;
	if c0.date1 			is null					then return false; end if;
	if c0.date1 			< now()::date -1		then return false; end if;
	--if t0.recur_ind 		is null					then return false; end if;
	--if t0.day0_ind	 		is null					then return false; end if;
	--if t0.day1_ind	 		is null					then return false; end if;
	--if t0.day2_ind	 		is null					then return false; end if;
	--if t0.day3_ind	 		is null					then return false; end if;
	--if t0.day4_ind	 		is null					then return false; end if;
	--if t0.day5_ind	 		is null					then return false; end if;
	--if t0.day6_ind	 		is null					then return false; end if;
	--if t0.recur_ind	and c0.date2 is null			then return false; end if;
	--if t0.recur_ind	and c0.date2 <= c0.date1		then return false; end if;
	--if t0.recur_ind	and c0.date2 > 	c0.date1+ c.max_date_range	then return false; end if;
	--if t0.recur_ind and not t0.day0_ind and not t0.day1_ind and not t0.day2_ind 
					--and not t0.day3_ind and not t0.day4_ind and not t0.day5_ind 
					--and not t0.day6_ind 
	--then return false;
	end if;

	return true;
END
$body$
language plpgsql;

create or replace function funcs.ins_trip( in_trip text, in_user text)
	returns trip
as
$body$
DECLARE
	t0 trip ;
	u0 RECORD ;
	i1 RECORD ;
	t1 RECORD ;
	valid boolean;
	dummy RECORD;
BEGIN
	SELECT * into t0	FROM funcs.json_populate_record(NULL::trip, in_trip) ;
	SELECT * into u0	FROM funcs.json_populate_record(NULL::usr , in_user) ;

	valid			:=	funcs.validate_trip(in_trip) ;
	if (not valid)	then return NULL::trip; end if;

	t0.driver_id	:=	u0.usr_id;
	t0.dir 			:=	funcs.bearing2(t0.p1, t0.p2);
	t0.trip_id		:=	uuid_generate_v4();
	t0.status_code	:=	'A' ;
	t0.c_ts			:=	clock_timestamp();
	t0.m_ts			:=	clock_timestamp();

	insert into trip values( t0.*) returning * into t1 ;
	return t1;
END
$body$
language plpgsql;

create or replace function funcs.upd_trip( in_trip text, in_user text)
	returns trip
as
$body$
DECLARE
	t0	RECORD ;
	t1	RECORD ;
	u0	RECORD ;
	c	RECORD	;
BEGIN
	SELECT * into t0	FROM funcs.json_populate_record(NULL::trip , in_trip) ;
	SELECT * into u0	FROM funcs.json_populate_record(NULL::usr 	, in_usr) ;
	c	:=	funcs.calc_cost(0,0,0)	;	;

	update trip t
	set 	seats = least(coalesce (t0.seats, t.seats), c.max_seats)
		,	price = least(coalesce (t0.price, t.price), c.maxPrice_driver)
	where 	t.trip_id	=	t0.trip_id
	and		t.usr_id	=	u0.usr_id
	and 	(t.seats != t0.seats or t.price!= t0.price)
	returning t.* into t1
	;
	return t1;
END
$body$
language plpgsql;

create or replace function funcs.ins_money_tran( 
		in_usr_id 		uuid
	,	in_actual_amount 	decimal
	,	in_tran_cd 		text
	,	in_ref_no 		text)
	returns money_tran
as
$body$
DECLARE
	m1	RECORD ;
BEGIN
	if actual_amount is null then return null::money_tran end if;
	if actual_amount = 0 then return null::money_tran end if;

	update usr u
	set balance = 	balance + actual_amount
	where	u.usr_id = in_usr_id
	returning u.* into u1;
	;
	insert into money_tran ( 
		  usr_id
		, trnx_cd
		, actual_amount
		, actual_ts 
		, reference_no
		, balance)
	select 
		  in_usr_id
		, in_tran_cd
		, in_actual_amount
		, clock_timestamp()
		, in_ref_no
		, u1.balance
	return m.* into m1
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
	else if	new_status_cd	= 'CPR'	then
		rider	:=	c.booking_fee	* b.seats 	;
	else if	new_status_cd	= 'CD'	then
		driver	:=	b.cost_driver	* (distance_time_factor + 0.2)	; -- apply addition 20% penalty
	else if	new_status_cd	= 'CR'	then
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
	b0				trip ;
	b1				trip ;
	ids				RECORD ;
	new_status_cd	text;
	penalty 		RECORD;
BEGIN
	SELECT * into u0	FROM funcs.json_populate_record(NULL::usr 	, in_user)	; 
	c		:=	from funcs.clac_cost(0,0,0)	;

	SELECT * into b0	
	FROM book b, funcs.json_populate_record(NULL::trip	, in_book) b0 
	where b.book_id=b0.book_id	;

	select * into t0	from	trip t where t.trip_id	=	b0.trip_id

	new_status_cd	:=
		case 	
			when b0.is_rider 	and b0.usr_id = u0.usr_id and b0.status_cd = 'P' then 'CPR' 
			when b0.is_rider 	and b0.usr_id = u0.usr_id and b0.status_cd = 'C' then 'CR' 
			when t0.is_rider 	and t0.usr_id = u0.usr_id and b0.status_cd = 'P' then 'RR' 
			when not b0.is_rider 	and b0.usr_id = u0.usr_id and b0.status_cd = 'P' then 'CPD' 
			when not b0.is_rider 	and b0.usr_id = u0.usr_id and b0.status_cd = 'C' then 'CD' 
			when not t0.is_rider 	and t0.usr_id = u0.usr_id and b0.status_cd = 'P' then 'RD' 
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

	update trip
	set seats	= least (seats + b1.seats. c.max_seats)
	where t.trip_id	=	b1.trip_id
	;

	-- return money to rider and apply penalty to rider or driver
	m1	:=	funcs.ins_money_tran(
	 		in_usr_id 			=> case when b1.is_rider then b1.usr_id else b1.trip_usr_id end
		,	in_actual_amount 	=> b1.cost_rider
		,	in_tran_cd 			=> 'R'
		,	in_ref_no 			=> b1.book_id) ;
	m1	:=	funcs.ins_money_tran(
	 		in_usr_id 			=> case when b1.is_rider then b1.usr_id else b1.trip_usr_id end
		,	in_actual_amount 	=> - b1.penalty_on_rider
		,	in_tran_cd 			=> 'P'
		,	in_ref_no 			=> b1.book_id) ;

	m1	:=	funcs.ins_money_tran(
	 		in_usr_id 			=> case when not b1.is_rider then b1.usr_id else b1.trip_usr_id end
		,	in_actual_amount 	=> - b1.penalty_on_rider
		,	in_tran_cd 			=> 'P'
		,	in_ref_no 			=> b1.book_id) ;

	return b1;
END
$body$
language plpgsql;


create or replace function funcs.confirm( in_book text, in_user text)
	returns book
as
$body$
DECLARE
	u0	RECORD ;
	b0	RECORD ;
	b1	RECORD ;
BEGIN
	SELECT * into b0 FROM funcs.json_populate_record(NULL::book 	, in_book) ;
	SELECT * into u0 FROM funcs.json_populate_record(NULL::usr 		, in_user) ;
	if b0.usr_id = u0.usr_id then
		;
	else
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

	return b1;
END
$body$
language plpgsql;

create or replace function funcs.finish( in_book text, in_user text)
	returns trip
-- mark the booking is complete to the satisfaction of rider
-- only ride can finish
as
$body$
DECLARE
	u0 RECORD ;
	b0 RECORD ;
	b1 RECORD ;
	t1 RECORD ;
	driver_id	uuid;
	driver_earning	ridemoney;
BEGIN
	SELECT * into b0 FROM funcs.json_populate_record(NULL::book , in_book) ;
	SELECT * into u0 FROM funcs.json_populate_record(NULL::usr , in_user) ;

	update 	book b
	set 	status_cd 	= 'F'
			, m_ts		= clock_timestamp()
			, finish_ts	= clock_timestamp()
	from 	trip t
	where 	b.book_id	=	b0.book_id
	and		t.trip_id	= 	b.book_id
	and		b.status_cd	='B'		-- make sure the booking is active
	and 	u0.usr_id in ( b.usr_id, t.usr_id) 	--double sure to defeat hacking
	returning b.* into b1
	;

	select t.* into t1
	from trip t
	where t.trip_id = b1.trip_id
	;

	update usr 
	set trips_completed = trips_completed+1
	where usr_id in ( b1.usr_id, t1.usr_id)
	;

	driver_earning 	:= case when b1.role_cd ='D' then b1.cost_book 	else b1.cost_offer	end ;
	driver_id		:= case when b1.role_cd ='D' then b1.usr_id		else t1.usr_id		end ;

	-- assign money to driver
	select * into m1 from funcs.ins_money_tran( in_usr_id => driver_id
										, in_actual_amount => driver_earning
										, in_tran_cd => 'F'
										, in_ref_no => b1.trip_id) ;
	return book1;
END
$body$
language plpgsql;

create or replace function funcs.search_region( in_criteria text, in_user text)
	returns setof json
as
$body$
	with user0	as ( 
		-- if usr_id is null, populated it with random uuid
		SELECT coalesce(t.usr_id, uuid_generate_v4()) usr_id	
		FROM funcs.json_populate_record(NULL::usr , in_user) t 
	)
	, c0 as (
		-- bounding box
		SELECT		
				least	((t.p1).lat, (t.p2).lat) p1_lat	
			, greatest	((t.p1).lat, (t.p2).lat) p2_lat	
			, least		((t.p1).lon, (t.p2).lon) p1_lon
			, greatest	((t.p1).lon, (t.p2).lon) p2_lon	
			, coalesce(t.seats		, 1)				 seats
			, coalesce(t.price/c.margin_factor		, c.max_price_driver)	max_price_driver
			, funcs.bearing2(t.rp1, t.rp2)- 43+4*search_tightness		min_rdir
			, funcs.bearing2(t.rp1, t.rp2)+ 43-4*search_tightness 		max_rdir
			, funcs.bearing2(t.rp1, t.rp2)- 43+4*search_tightness + 360	min_rdir_360
			, funcs.bearing2(t.rp1, t.rp2)+ 43-4*search_tightness + 360	max_rdir_360
			, funcs.bearing2(t.rp1, t.rp2)- 43+4*search_tightness - 360	min_rdir_360_1
			, funcs.bearing2(t.rp1, t.rp2)+ 43-4*search_tightness - 360	max_rdir_360_1
			-- bigger the angle, narrower the sector
			, sin((funcs.bearing2(t.rp1, t.rp2)-39-4*search_tightness)/360*2*pi())		sin_rdir_1 
			, cos((funcs.bearing2(t.rp1, t.rp2)-39-4*search_tightness)/360*2*pi())		cos_rdir_1
			, sin((funcs.bearing2(t.rp1, t.rp2)+39+4*search_tightness)/360*2*pi())		sin_rdir_2
			, cos((funcs.bearing2(t.rp1, t.rp2)+39+4*search_tightness)/360*2*pi())		cos_rdir_2
			, t.rp1
			, t.rp2
			, t.date1
			, t.date2
			, time '0:0' 
				+ greatest (0		, extract (epoch from	coalesce(t.departure_time, time '00:00' ))
								- t.distance/60*3600+3600) * interval '1 second' time1
			, time '0:0' 
				+ least (3600*24-1 	, extract (epoch from	coalesce(t.departure_time, time '23:59' ))
								+ t.distance/60*3600+3600) * interval '1 second' time2
			, t.distance 
			, t.distance /(3-0.2*search_tightness)		min_distance
			, t.distance *(4-0.2*search_tightness)								max_distance
			, 1.0/60*(0.1+0.05*search_tightness)		axes_move
			, c.margin_factor
		FROM funcs.json_populate_record(NULL::funcs.criteria , in_criteria) t 
				, funcs.calc_cost(0,0,0)	c	
	)
	, a as (
		select t.start_display_name, t.end_display_name 
			, t.start_lat
			, t.start_lon
			, t.end_lat
			, t.end_lon
			--, t.distance 
			, t.description
			, t.driver_id				
			, j.journey_id				
 			, j.trip_id				 
 			, j.journey_date		
 			, j.departure_time	
		--	, u.balance
			, j.seats
			, (funcs.calc_cost(j.price, c0.distance , c0.seats , true)).rider_cost
			, j.price*c0.margin_factor || ' per mile' rider_price
			, coalesce (b.seats,0) seats_booked
			, case when u.balance >=	funcs.calc_cost(j.price ,t.distance	,c0.seats , true)
				then true else false 
				end sufficient_balance
			, case when ut.profile_ind then ut.sm_link else null end sm_link
			, ut.headline
			, c0.rp1
			, c0.rp2
		from journey j
		join user0 on (1=1)	-- usr0 may not ba available because of not signed in
		join c0 on (1=1)
		join trip t on	( 
			t.trip_id	=	j.trip_id
			and t.driver_id	!= 	user0.usr_id
			and t.status_code = 'A'
			-- trip start and end must inside the bounding box
			and t.start_lat between c0.p1_lat and c0.p2_lat
			and t.start_lon between c0.p1_lon and c0.p2_lon
			and t.end_lat between c0.p1_lat and c0.p2_lat
			and t.end_lon between c0.p1_lon and c0.p2_lon
			and t.distance	between c0.min_distance and c0.max_distance
			and ( 	t.dir	 between c0.min_rdir and c0.max_rdir
				or	t.dir	 between c0.min_rdir_360 and c0.max_rdir_360
				or	t.dir	 between c0.min_rdir_360_1 and c0.max_rdir_360_1
				)
			-- this axes rotation is very rudimental. Needs refinement.
			and (t.end_lat	-(c0.rp1).lat)*cos_rdir_1 	- (end_lon	-(c0.rp1).lon)	* sin_rdir_1 
				> c0.distance*c0.axes_move
			and (t.end_lat	-(c0.rp1).lat)*cos_rdir_2	- (end_lon	-(c0.rp1).lon)	* sin_rdir_2 
				> c0.distance*c0.axes_move
			and (t.start_lat-(c0.rp2).lat)*cos_rdir_1 	- (start_lon-(c0.rp2).lon)	* sin_rdir_1 
				< - c0.distance*c0.axes_move
			and (t.start_lat-(c0.rp2).lat)*cos_rdir_2	- (start_lon-(c0.rp2).lon)	* sin_rdir_2 
				< - c0.distance*c0.axes_move
		)
		join usr 	ut on (ut.usr_id=t.driver_id) -- to get driver sm_link
		left outer join usr u on (u.usr_id = user0.usr_id) -- to get bookings
		left outer join book b on (	b.rider_id = user0.usr_id
						and b.journey_id=j.journey_id
						and b.status_cd in ('P', 'B')
					)
		where j.status_code='A'
		and j.seats >= c0.seats
		and j.price <= c0.max_price_driver
		and j.journey_date between c0.date1 and c0.date2
		and j.departure_time between c0.time1 and c0.time2
		order by j.journey_date , j.departure_time
		limit 100
	)
	select row_to_json(a) 
	from a
	order by a.journey_date, a.departure_time
	;
$body$
language sql;


--select * from funcs.search('{"departure_time": null, "distance": 30.7, "end_date": null, "end_display_name": "Millennium Centre, 33, West Ontario Street, Magnificent Mile, Chicago, Cook County, Illinois, 60654, USA", "end_lat": "41.89285925", "end_loc": "33 w ontario st, chicago", "end_lon": "-87.6292175246499", "price": 0.2, "seats": 1, "start_date": null, "start_display_name": "2916, Colton Court, Lisle, DuPage County, Illinois, 60532, USA", "start_lat": "41.7944060204082", "start_loc": "2916 colton ct", "start_lon": "-88.1075615306122"}');

create or replace function funcs.book_count_of_trip ( in_trip_id text)
	returns bigint
as
$body$
	select count(1)	cnt
	from trip t 
	join journey j on ( j.trip_id=t.trip_id)
	join book b on (b.journey_id = j.journey_id)
	where t.trip_id = in_trip_id::uuid
$body$
language sql;

create or replace function funcs.book( in_book text,	in_user text)
	returns json
as
$body$
DECLARE
		u0 RECORD ;
		b0 RECORD ;
		t0 RECORD ;
BEGIN
	SELECT * into u0 FROM funcs.json_populate_record(NULL::usr , in_usr) ;
	SELECT * into b0 FROM funcs.json_populate_record(NULL::book , in_book) ;
	SELECT * into t0 FROM trip where t0.trip_id = b0.trip_id;

	if u0.usr_id = b0.usr_id then
		;
	else
		return funcs.gen_error('201811190902', 'user not signed in');
	end if;

	if u0.usr_id = t0.usr_id then
		return funcs.gen_error('201811190902', 'offerer and booker cannot be the same');
	end if;

	if b0.is_rider and not t0.is_rider then
		return funcs.book_rider(in_book text,    in_user text)
	else if not b0.is_rider and  t0.is_rider then
		return funcs.book_driver(in_book text,    in_user text)
	else 
		return funcs.gen_error('201811190018', 'both are driver or rider');
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
		cost RECORD
BEGIN
	SELECT * into u0	FROM funcs.json_populate_record(NULL::usr , in_usr) ;
	SELECT * into b0	FROM funcs.json_populate_record(NULL::book , in_book) ;
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
    ,   is_rider
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
	,	b0.is_rider
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
	return b1;
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
		cost RECORD
BEGIN
	SELECT * into u0	FROM funcs.json_populate_record(NULL::usr 	, in_usr) ;
	SELECT * into b0	FROM funcs.json_populate_record(NULL::book 	, in_book) ;
	select * into t0	from trip t where t.trip_id = b0.trip_id ;
	select * into u1	from usr	where u.usr_id	= t0.usr_id	;		-- rider

	cost 	:= funcs.calc_cost_driver(t0.cost , b0.seats )	;

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
    ,   is_rider
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
	,	b0.is_rider
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
	return b1;
END
$body$
language plpgsql;


create or replace function funcs.get_money_trnx( in_criteria text, in_user text)
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
		join money_trnx t on ( t.usr_id= u0.usr_id)
		join	c0 on (1=1)	
		left outer join money_trnx_trnx_cd cd on (	cd.cd = t.trnx_cd)
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

create or replace function funcs.withdraw( in_trnx text, in_user text)
	returns money_trnx
as
$body$
DECLARE
		t0 RECORD ;
		u0 RECORD ;
		t1 RECORD ;
BEGIN

	SELECT * into t0 FROM funcs.json_populate_record(NULL::money_trnx, in_trnx) ;
	SELECT * into u0 FROM funcs.json_populate_record(NULL::usr, in_user) ;

	insert into money_trnx ( 
		  usr_id
		, trnx_cd
		, requested_amount
		, request_ts
		, bank_email
		, reference_no	
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

		return t1;
END
$body$
language plpgsql;

create or replace function funcs.finish_withdraw( in_trnx text, in_user text)
	returns money_trnx
as
$body$
DECLARE
		t0 RECORD ;
		u0 RECORD ;
		t1 RECORD ;
BEGIN

	SELECT * into t0 FROM funcs.json_populate_record(NULL::money_trnx, in_trnx) ;
	--SELECT * into u0 FROM funcs.json_populate_record(NULL::usr, in_user) ;


	update money_trnx m
	set 	  actual_amount = -least(greatest(0,u.balance), -m.requested_amount)
			, actual_ts		= clock_timestamp()	
	from 	usr u
	where 	u.usr_id=m.usr_id
	and		m.money_trnx_id=t0.money_trnx_id
	returning m.* into t1
	;

	update usr 
	set balance = balance + t1.actual_amount
	;

	return t1;
END
$body$
language plpgsql;

create or replace function funcs.deposit( trnx text)
	returns money_trnx
as
$body$
DECLARE
		s0 RECORD ;
		u0 RECORD ;
		m1 RECORD ;
BEGIN
	SELECT * into s0 FROM funcs.json_populate_record(NULL::funcs.criteria, trnx) ;
	select * into u0 from usr u where u.deposit_id=s0.deposit_id;

	m1	:=	funcs.ins_money_tran(
	 		in_usr_id 			=> u0.usr_id
		,	in_actual_amount 	=> s0.actual_amount
		,	in_tran_cd 			=> 'D'
		,	in_ref_no 			=> s0.reference_no 
		);

	return m1;
END
$body$
language plpgsql;

create or replace function funcs.activity(in_criteria text, in_user text)
	returns setof json
as
$body$
-- in_trip has start_date and end_date
-- if input json string has fields with "" value, change their value to null in order to avoid error when converting empty string to date
	with c0 as (
		SELECT * FROM funcs.json_populate_record(NULL::funcs.criteria , in_criteria)
	)
	, user0	as ( 
		SELECT * FROM funcs.json_populate_record(NULL::usr , in_user)
	)
	, ids as (
		select	t.trip_id, j.journey_id, b.book_id, t.driver_id, b.rider_id, u0.usr_id
		from user0 	u0
		join c0	 	on (1=1)
		join trip 	t 	on ( t.driver_id=u0.usr_id )
		join journey 	j	on (t.trip_id=j.trip_id
			and	j.journey_date between coalesce(c0.date1	, '1970-01-01') 
						and coalesce(c0.date2	, '3000-01-01')
			)
		join book 	b	on (b.journey_id=j.journey_id )
		-- join book_status s on (s.status_cd= b.status_cd)
		union
		select	t.trip_id, j.journey_id, b.book_id, t.driver_id, b.rider_id, u0.usr_id
		from user0 	u0
		join c0 	on (1=1)
		join book 	b 	on ( b.rider_id= u0.usr_id)
		join journey 	j 	on ( j.journey_id = b.journey_id
			and	j.journey_date between coalesce(c0.date1	, '1970-01-01') 
						and coalesce(c0.date2	, '3000-01-01')
			)
		join trip 	t 	on ( t.trip_id = j.trip_id)
		union 
		-- get bookable journeys to allow its driver to change seats and price
		select	t.trip_id, j.journey_id, null book_id, t.driver_id, null rider_id, u0.usr_id
		from user0	u0
		join c0	 	on ( 1=1)
		join trip 	t 	on ( t.driver_id=u0.usr_id )
		join journey	j	on (t.trip_id=j.trip_id
			and	j.journey_date between coalesce(c0.date1	, '1970-01-01') 
						and coalesce(c0.date2	, '3000-01-01')
			and j.status_code = 'A'
			)
	)
	, a as (
		select 
			ids.trip_id
			, ids.driver_id
			, ids.rider_id
			, ids.journey_id
			, ids.book_id 
			, t.start_display_name
			, t.start_lat
			, t.start_lon
			, t.end_display_name
			, t.end_lat
			, t.end_lon
			, t.description
			-- , t.distance
			, j.journey_date
			, j.departure_time
			, j.status_code
			, case 
				when ids.usr_id = t.driver_id	then coalesce(b.driver_price, j.price)
				when ids.usr_id	= b.rider_id 	then b.rider_price	
				else null
				end price
			, case 
				when ids.usr_id = t.driver_id	then b.driver_cost 
				when ids.usr_id = b.rider_id	then b.rider_cost	
				else null
				end unified_cost -- either driver's cost or rider's cost
			, coalesce(b.seats , j.seats) seats	-- either seats available or seats booked
			--, case when ids.usr_id = t.driver_id then b.driver_cost else null end driver_cost
			--, case when ids.usr_id = b.rider_id then b.rider_cost else null end rider_cost
			, b.status_cd 
			, case when s.description is null then 'Published'
				else s.description
				end book_status_description
			--, case when ids.usr_id = ids.driver_id then true else false end is_driver
			--, case when ids.usr_id = ids.rider_id then true else false end is_rider
			, case when ids.usr_id = t.driver_id then true else false end is_driver
			, case when ids.usr_id = b.rider_id	then true else false end is_rider
			, b.pickup_display_name
			, b.pickup_lat
			, b.pickup_lon
			, b.dropoff_display_name
			, b.dropoff_lat
			, b.dropoff_lon
			, case 	when ids.usr_id = t.driver_id then ur.headline else ud.headline end headline
			, case 	when ids.usr_id = t.driver_id and ur.profile_ind then ur.sm_link	
					when ids.usr_id = b.rider_id  and ud.profile_ind then ud.sm_link	
					else null
			  end sm_link
		from ids 
		join trip 		t 	on ( t.trip_id=ids.trip_id )
		join journey 		j 	on (j.journey_id= ids.journey_id) 
		join usr		ud 	on ( ud.usr_id=ids.driver_id)
		left outer join usr	ur 	on ( ur.usr_id=ids.rider_id)
		left outer join book 	b 	on (b.book_id= ids.book_id )
		left outer join book_status s 	on (s.status_cd= b.status_cd)
	)
	select row_to_json(a) 
	from a
	order by a.journey_date , a.departure_time
	;
$body$
language sql;

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
				 	when u0.usr_id != m.usr_id and m.usr_id = b.rider_id then 'Rider'
				 	else 'Driver'
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
	returns msg
as
$body$
DECLARE
	m0 RECORD; 
	u0 RECORD ;
	m1 msg ;
	m2 RECORD ;
BEGIN
	SELECT * into m0 from funcs.json_populate_record(NULL::msg, in_msg) ;
	SELECT * into u0 from funcs.json_populate_record(NULL::usr, in_user) ;
	
	insert into msg ( book_id, usr_id, msg) 
		values	( m0.book_id, u0.usr_id, m0.msg)
	returning * into m1
	;

	return m1;
END
$body$
language plpgsql;
