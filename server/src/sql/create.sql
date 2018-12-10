-- to run this script
-- su postgres -c psql < src/sql/create.sql
drop database if exists ride;
create database ride; 
drop user if exists ride;
create user ride with password 'ride';
-- alter database ride owner to ride;
GRANT ALL PRIVILEGES ON DATABASE ride to ride;
\c ride
grant all on all tables in schema public to ride;
CREATE EXTENSION pgcrypto;
CREATE EXTENSION	"uuid-ossp";

CREATE DOMAIN email AS TEXT 
CHECK(
	VALUE ~ '^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-]{1,30}\.){1,4}([a-zA-Z]{2,5})$' 
);

CREATE DOMAIN sys_id as uuid default uuid_generate_v4() ;
CREATE DOMAIN textwithdefault as text default '' ;
CREATE DOMAIN sys_ts timestamp with time zone default clock_timestamp();
-- CREATE DOMAIN tswithepoch timestamp with time zone default '1970-01-01 00:00:00Z' ;
CREATE DOMAIN score integer	CHECK ( value in (1,2,3,4,5));
CREATE DOMAIN ridemoney decimal(10,4) ;

CREATE TYPE location AS
(
	  loc			text 	-- user input address
	, lat			decimal(10,7)
	, lon			decimal(10,7)
	, display_name	text		-- reverse geocoded
);

create type cost as
(
      booking_fee   real
    , margin_factor real
    , price_driver  real
    , price_rider   real
    , cost_driver   ridemoney
    , cost_rider    ridemoney
    , max_price_driver  real
    , max_price_rider   real
    , max_seats     smallint
);



create table usr
(
	  usr_id			sys_id not null
	, first_name		text
	, last_name			text
	, headline			text
	, email 			email 
	, bank_email 		email
	, member_since 		sys_ts not null
	, trips_published 	integer not null default 0	-- for driver
	, rides_published 	integer not null default 0		-- for rider
	, trips_completed 	integer not null default 0     -- for driver
	, rides_completed 	integer not null default 0		-- for rider
	, rating			decimal (5,2) not null default 0
	, balance			ridemoney not null default 0
	, oauth_id			text not null
	, oauth_host		text not null default 'linkedin'
	, deposit_id		sys_id not null
	, sm_link			text	-- social media link
	, profile_ind		boolean not null default false
	, c_ts 				sys_ts not null
	, m_ts 				sys_ts not null
	, constraint pk_usr PRIMARY KEY (usr_id)
	, constraint uk_usr unique	(oauth_id)
) ;

create index ix_usr_oauth_id on usr(oauth_id);

CREATE TABLE trip 
(
		trip_id		sys_id		not null
	,	usr_id		sys_id		not null
	,	rider_ind	boolean		not null -- Driver Rider
	,	trip_date	date		not null
	,	trip_time	time		not null
	,	p1			location	not null
	,	p2			location	not null
	,	dir			real		not null
	,	price		real		not null
	,	distance	real		not null 
	,	seats		smallint	not null
	,	status_cd	text 		not null -- for offer, Active, Expired, No more Booking
	,	description text
	,	c_ts		sys_ts not null
	,	m_ts		sys_ts not null
	,	c_usr 		text
	,	constraint 	pk_trip		PRIMARY KEY (trip_id)
	,	constraint 	fk_trip2usr 	foreign key (usr_id)	REFERENCES	usr 	( usr_id)
);
create index ix_trip_usr_id on trip(usr_id);
create index ix_trip_dir_distance on trip(dir, distance) where status_cd = 'A' and seats > 0;
alter table trip add constraint ck_trip_status_cd check (status_cd in ('A','E',  'NB' ) );

CREATE TABLE book
(
		book_id		sys_id		not null
	,	trip_id		sys_id		not null	
	,	usr_id		sys_id		not null
	--,	rider_ind	boolean		-- Driver Rider
	--,	trip_date	date		
	--,	trip_time	time		
	,	p1			location	not null
	,	p2			location		-- can be null if booker is driver
	--,	dir			decimal (6,2)
	,	distance	real	-- can be null if booker is driver
	,	seats		smallint
	, 	cost		cost
	,	penalty_on_rider		ridemoney
	,	penalty_on_driver		ridemoney
	--,	rating		smallint
	--,	review		text
	,	book_ts		sys_ts
	,	confirm_ts	timestamp with time zone
	,	cancel_ts	timestamp with time zone
	,	finish_ts	timestamp with time zone
	,	status_cd	text not null default 'P' 	-- for booking, booked Pending confirmation, Confirmed, trip Started,
							-- Cancelled by Driver, Cancelled by Rider, Finished, 
							-- Rejected by Rider, Rejected by Driver, Cancelled while pending by Driver, 
							-- Cancelled while pending by Rider
	,	c_ts		sys_ts not null
	,	m_ts		sys_ts not null
	,	c_usr 		text
	,	constraint pk_book		PRIMARY KEY (book_id)
	,	constraint fk_book2trip foreign key (trip_id)	REFERENCES	trip 	( trip_id)
	,	constraint fk_book2usr 	foreign key (usr_id)	REFERENCES	usr 	( usr_id)
);

create index ix_book_usr_id on book(usr_id);
alter table book add constraint ck_book_status_cd 
	check (status_cd in ('P', 'C', 'RD', 'RR', 'CPD', 'CPR', 'CD', 'CR',  'F' ) );

CREATE TABLE review
(
		review_id	sys_id		not null
	,	book_id		sys_id		not null
	,	usr_id		sys_id		not null	-- reviewee usr_id
	,	rating		smallint
	,	review		text
	,	c_ts		sys_ts 		not null
	,	m_ts		sys_ts 		not null
	,	c_usr 		text
	,	constraint pk_review		PRIMARY KEY (review_id)
	,	constraint uk_review		unique (book_id, usr_id)
	,	constraint fk_review2book 	foreign key (book_id)	REFERENCES	book 	( book_id)
);
create index ix_review_book_id on review(book_id);
create index ix_review_usr_id on review(usr_id);

create table money_tran 
(
	  money_tran_id		sys_id not null
	, usr_id			sys_id not null
	, tran_cd			text not null -- Deposit, Withdraw, Penalty, trip Finished, Booking
	, status_cd			text not null default 'K' --
	, requested_amount	ridemoney 
	, actual_amount		ridemoney
	, balance			ridemoney 	-- balance after transaction
	, request_ts		timestamp with time zone
	, actual_ts			timestamp with time zone
	, bank_email		email
	, ref_no			text
	, cmnt 				text
	, c_ts				sys_ts not null
	, m_ts				sys_ts not null
	, constraint pk_money_tran PRIMARY KEY (money_tran_id)
	, constraint fk_tran2usr foreign key ( usr_id) REFERENCES	usr ( usr_id)
);
create index ix_money_tran_usr_id on money_tran(usr_id);
alter table money_tran add constraint ck_money_tran_tran_cd 
	check (tran_cd in ('D', 'W', 'P', 'E', 'B', 'R') );
alter table money_tran add constraint ck_money_tran_status_cd 
	check (status_cd in ('K', 'F') );


create table msg (
		msg_id 	sys_id 	not null
	, 	book_id sys_id 	not null
	, 	usr_id 	sys_id 	not null
	, 	c_ts	sys_ts 	not null
	, 	msg		text 	not null
	, 	p1		location
	, 	constraint fk_msg2usr 	foreign key ( usr_id)	REFERENCES	usr		( usr_id)
	, 	constraint fk_msg2book 	foreign key ( book_id)	REFERENCES	book	( book_id)
);
create index ix_msg_book_id on msg(book_id);
create index ix_msg_usr_id on msg(usr_id);

create table code (
	  code_type		text not null
	, cd			text not null
	, description	text not null
	, constraint 	pk_code PRIMARY KEY (code_type, cd)
)
;

insert into code values
  ('BK'		, 'P'	, 'Pending confirmation')
, ('BK'		, 'C'	, 'Confirmed')
, ('BK'		, 'S'	, 'trip started')
, ('BK'		, 'CR'	, 'cancelled by rider')
, ('BK'		, 'CD'	, 'cancelled by driver')
, ('BK'		, 'CPR'	, 'cancelled by rider')	-- cancel while pending by rider
, ('BK'		, 'CPD'	, 'cancelled by driver')	-- cancel while pending by driver
, ('BK'		, 'F'	, 'Finished')
, ('BK'		, 'RD'	, 'Rejected by driver')
, ('BK'		, 'RR'	, 'Rejected by rider')
, ('TRAN'	, 'D'	, 'Deposit')
, ('TRAN'	, 'W'	, 'Withdraw')
, ('TRAN'	, 'P'	, 'Penalty')
, ('TRAN'	, 'B'	, 'Booking')
, ('TRAN'	, 'R'	, 'Return')
, ('TRAN'	, 'E'	, 'Earning')		-- earning from completed Trip
, ('TRIP'	, 'A'	, 'Published')
, ('TRIP'	, 'E'	, 'Expired')
, ('TRIP'	, 'NB'	, 'No more booking allowed')
--, ('JN'	, 'A'	, 'Active')
--, ('JN'	, 'E'	, 'Expired')
, ('TRAN_STATUS'	, 'K', 'OK, Success')
, ('TRAN_STATUS'	, 'F', 'Failed')
;


--alter table trip add FOREIGN KEY (driver_id) REFERENCES usr (usr_id);
--alter table journey add FOREIGN KEY (trip_id) REFERENCES trip (trip_id);
--alter table book add FOREIGN KEY (rider_id) REFERENCES usr (usr_id);
--alter table book add FOREIGN KEY (journey_id) REFERENCES journey (journey_id);
--alter table money_tran add FOREIGN KEY (usr_id) REFERENCES usr (usr_id);
--alter table book add FOREIGN KEY (status_cd) REFERENCES book_status (status_cd);
--alter table msg add FOREIGN KEY (book_id) REFERENCES book (book_id);
--alter table msg add FOREIGN KEY (usr_id) REFERENCES usr (usr_id);

create or replace view trip_status as select cd status_cd, description trip_status_description
from code where code_type ='TRIP';

create or replace view book_status as select cd status_cd, description book_status_description
from code where code_type ='BK';

create or replace view money_tran_tran_cd as select cd tran_cd , description 
from code where code_type='TRAN';

--grant all on public.criteria to ride;
grant all on public.usr to ride;
grant all on public.trip to ride;
--grant all on public.journey to ride;
grant all on public.book to ride;
grant all on public.money_tran to ride;
grant all on public.msg to ride;
grant all on public.code to ride;
grant all on public.review to ride;
grant all on public.trip_status to ride;
grant all on public.book_status to ride;
grant all on public.money_tran_tran_cd to ride;

