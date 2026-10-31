BEGIN;

REVOKE ALL PRIVILEGES
ON TABLE public.profiles,
 üÁÕ±¥¹ÁÉ½ÕÑ}ÑåÁÌ°(ÁÕ±¥¹Ñ½É¥Ìÿð¢V&Æ2ç&öGV7E÷GUö6FVv÷&W2À¢V&Æ?ËÙXÝËXXËÙXÝØ\ÜÙ]ËXc.product_files
FROM anon, authenticated, service_role;

ü´´AÕ±¥±¥¹ÑÌÉ¥ÙÉµ½¹±äÍÌÑ¼µÉ­ÑÁ±ÿò×f6&ÆRFFà¤u$åB4TÄT5@¤ôâD$ÄRV&Æ2ç&öfÆW2À¢ÈXXËÙXÝÝ\\ËXXËØ]YÛÜY\Ë?        public.product_type_categories,
         public.pýÉ½ÕÑÌ°(ÁÕ±¥¹ÁÉ½ÕÑ}ÍÍÑÌ)Q<¹½¸ì((´´M¥ÿöVBÖâ6ÆVçG3¢&öfÆR&VB66W73²&öfÆRVFG2&VÖâØÛÛ[[\ØÛÜYÔSÑSPÕÓPHXXËÙ[\ÈÈuthenticated;
GRANT UPDATE (username, display_name, avataýÉ}ÁÑ °¥¼°ÝÍ¥Ñ}ÕÉ°¤)=8Q	1ÁÕ±¥¹ÁÉ½¥±ÌQ<ÕÿöVçF6FVC° ¢ÒÒWFVçF6FVB5%TB27FÆÂ6öç7G&æVB/ÞHH^\Ý[ÈÈÛXÚY\ËÔSÑSPÕSÑTTU, DELETE
ON TABLE public.product_types,
         public.cýÑ½É¥Ì°(ÁÕ±¥¹ÁÉ½ÕÑ}ÑåÁ}Ñ½É¥Ì°(ÿòV&Æ2ç&öGV7G2À¢V&Æ2ç&öGV7Eö76WG2À¢ÈXXËÙXÝÙ[\ÂÈ]][XØ]YÂÔSÑSPÕ?
ON TABLE public.product_types,
         public.categorieýÌ°(ÁÕ±¥¹ÁÉ½ÕÑ}ÑåÁ}Ñ½É¥Ì°(ÁÕÿö2ç&öGV7G2À¢V&Æ2ç&öGV7Eö76WG2À¢V/ÛXËÙXÝÙ[\ÂÈ]][XØ]YÂKHÙ\\\ÚYHÙ\ce role gets runtime CRUD, not schema-management privilegýÌ¸)I9PM1P°%9MIP°UAQ°1Q)=8Q	1ÁÕ±¥ÿ÷&öfÆW2À¢V&Æ2ç&öGV7E÷GW2À¢V&Æ2ïØØ]YÛÜY\ËXXËÙXÝÝ\WØØ]YÛÜY\Ë?     public.products,
         public.product_assets,
   üÁÕ±¥¹ÁÉ½ÕÑ}¥±Ì)Q<ÍÉÙ¥}É½±ì()=55%Pìÿÿÿ