echo $TAGRET_SERVER
cd ./server
#cargo build  --release    #uncomment if not built
cd -
cd ./client
#ng build --prod    #uncomment if not built

cd  -

ssh ubuntu@$TAGRET_SERVER  'mkdir -p ~ubuntu/ride'
ssh ubuntu@$TAGRET_SERVER  'rm -rf ~ubuntu/ride/*'
#scp -p 2222 -r ./server/src/sql ./html ./client/dist/ride/* ./server/target/release/server_all root@$TAGRET_SERVER:/var/www/$TARGET_SERVER/.
scp -r ./server/src/sql ./client/dist/ride3/* ./server/target/release/server_all ubuntu@$TAGRET_SERVER:/home/ubuntu/ride/.

