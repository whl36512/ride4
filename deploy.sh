echo $TARGET_SERVER
cd ./server
#cargo build  --release    #uncomment if not built
cd -
cd ./client
#ng build --prod    #uncomment if not built

cd  -

ssh ubuntu@$TARGET_SERVER  'mkdir -p ~ubuntu/ride'
ssh ubuntu@$TARGET_SERVER  'rm -rf ~ubuntu/ride/*'
scp -r ./server/src/sql ./client/dist/ride3/* ./server/target/release/server_all ubuntu@$TARGET_SERVER:/home/ubuntu/ride/.


#login as ubuntu and then root. run
#	scp -r /home/ubuntu/ride/* root@10.0.0.2:/var/www/ride/.
#login to container and run
# 	nohup  /var/www/ride/server_all > /root/log/server_all.log &
#	systemctl restart httpd

# email log file: /tmp/email_down.log

