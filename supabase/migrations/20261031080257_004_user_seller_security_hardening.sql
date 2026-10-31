
BEGIN;

REVOKE ALL PRIVILEGES
ON TABLE public.product_fiý±Ì)I=4¹½¸°AU	1%ì()I9PM1P°%9MIP°UAQ°ÿôUDP¤ôâD$ÄRV&Æ2ç&öGV7EöfÆW0¥DòWFVçF6FVC° ¤u$ïÕSUSQÑTÂÓPHXXËÙXÝÙ[\ÂÈÙ\XÙ_role;

ALTER DEFAULT PRIVILEGES
FOR ROLE postgres
IN SCHý5ÁÕ±¥)IY=-M1P°%9MIP°UAQ°1Q)=8Q	1ÿõ0¤e$ôÒæöâÂWFVçF6FVBÂ6W'f6U÷&öÆS° ¤ÅDU"DTdTÅBÔUSQÑTÂÔÓHÜÝÜ\ÂSÐÒSPHXXÂUÒÑHVPÿUTE
ON FUNCTIONS
FROM PUBLIC, anon, authenticated, servicý}É½±ì()1QHU1PAI%Y%1L)=HI=1Á½ÍÑÉÌ)%8MÿôTÔV&Æ0¥$Udô´RU4tRÂ4TÄT5@¤ôâ4UTTä4U0¤e$ôÒæöâÂØ]][XØ]YÙ\XÙWÜÛNÂUÒÑHTUBÓPHX?ic.profiles
FROM authenticated;

GRANT UPDATE (
    usernýµ°(¥ÍÁ±å}¹µ°(ÙÑÉ}ÁÑ °(¥¼°(ÝÿöFU÷W&À¢¤ôâD$ÄRV&Æ2ç&öfÆW0¥DòWFVçF6FVC° ¤u$ÓSUSQÑTÂÓPHXXËÙ[\Ëblic.products,
           public.product_assets,
        üÁÕ±¥¹ÁÉ½ÕÑ}¥±Ì)Q<ÍÉÙ¥}É½±ì()=55%Pì(ÿÿÿ