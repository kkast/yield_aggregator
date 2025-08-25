# Yield Aggregation Service

## System design
- Fetcher
- API server
- PostgresDB

To optimize API requests and fetching different providers I introduce 2 services: 

Fetcher - program that fetches data from a provider and stores into the db

API server - service that processes requests and reads data from the db fetcher put data into. API server can have its own cache. If there arent many overall requests, cache doesnt seem to solve a problem and accessing a db per requestmcan be a working solution. With a number of requests growing, each api server container's cache can store in memory data per  provider with the timestamp after which a new access to the db is required to populate cache with new data on a relevant request.

Both servers can be scaled horizontally, there can be many api servers and multiple fetchers. Both processes should be containerized but I didnt set up Docker for this project although it is straightforward going forward.

Fetcher reads env.fetcher file to get the data for what providers it is running. It is architected such that 1 fetcher can run  1 or many providers. In case 1 or a group of providers are under more load or have more heavy compute logic, they can be separated into multiple instances of fetchers. What providers to run is specified in end.fetchers file with more info such as refresh rate if needed to be changed for a particular container. Each fetcher is running intervals, 1 interval per provider. Fetchers can have intersecting providers, but it can have some effect on performance on write operations, not too much for the current project because tables are small and delays will happen on writing into conflicting rows. In case a provider is unavailable, the API can still get data that was the last available from the db. On the fetcher side, the interval will continue accessing the unavailable endpoint. Since the update rate isnt often and most of the time is spent on async providers' endpoint and db waiting, it wont affect performance if we allow setInterval to repeat fetch with the same period as always(if it is minutes) or if we repeat fetch in a period that makes sense for an endpoint that isnt updated as often(e.g. daily). 

This is not implmented in current code, but potentially logic for using workers or setTimeout can be implmeneted. In case there are providers that fetch apis more often or have more computation, we should track the number of failing attempts per provider in the worker or setTimeout logic. We could increase the time period of fetching in this case to not steal resources from working endpoints. The alert system should be implemented which can be an email, telegram message etc + graphical representation of provider availability. As one of the options in case of failing provider, a new fetcher just for that provider can be spawned. In this case other providers will continue perform well, and in case the endpoint is back, the delay of data fetching can be reduced.

### Providers
Fetcher is in ./src/fetcher, API is in ./src/api. Common logic for providers is in ./src/providers folder. Adding a new  provider is as simple as imlementing a new class that extends Provider class. It makes it easy to add a new provider, and make the data from a new provider act similar to all the other data providers. If a new provider has different API structure, inside the new class the logic can be added to transform schema. In case a provider changes their API format, it can also be changed in ./src/providers/provider_name.ts

### Testing

One of the benefits of such approach is that Fetcher and API server can be developed independently of each other. They are in a monorepo to share common data structures and logic, but the development of new features for one isnt blocking the other service, assuming exisitng data structure isnt changed. Thus, each service can be tested independently of each other. Fetcher has its set of tests, API server has its own. The database can be populated with test data, or mocked in test files to test particular function to speed up testing.


# DB set up
# one-time manual setup
psql postgres

CREATE ROLE yield_user WITH LOGIN PASSWORD 'yield_password';
CREATE DATABASE opportunities OWNER yield_user;
ALTER ROLE yield_user CREATEDB;

npx prisma migrate dev --name init

# match logic

YieldOpportunity doesnt have min investment amount from api so i didnt get to use maxAllocationPct