
BEGIN;

-- 1. Index the category-side foreign key.
CREATý%9`%9=Pa%MQLÁÉ½ÕÑ}ÑåÁ}Ñ½É¥Í}Ñ½Éå}¥ÿõöG¤ôâV&Æ2ç&öGV7E÷GUö6FVv÷&W26FVv÷'öB° ¢ÒßÈÛÛÛÛY]HÙXÝ\HÛXÚY\È[ØXÚHHÕ?ookup per statement.
DROP POLICY IF EXISTS "Active producýÐÑåÁÌÉÉ±)=8ÁÕ±¥¹ÁÉ½ÕÑ}ÑåÁÌì)I=@A=1%ÿõbU5E2$FÖç2ÖævR&öGV7BGW2 ¤ôâV&Æ2ç&öG_ØÝÝ\\ÎÂÔPUHÓPÖHXÝ]HÙXÝ\\È\HXYX¿le"
ON public.product_types
FOR SELECT
TO anon, authenticýÑ)UM%9 (¥Í}Ñ¥ÙôÑÉÕ(=H ¡M1PÕÑ ¹©ÿ÷BÓâvöÖWFFFrÓãâw&öÆRrÒvFÖâp¢° ¤5$TDRÓÓPÖHYZ[È[Ù\ÙXÝ\\ÈÓXXËÙXÝÝ\?es
FOR INSERT
TO authenticated
WITH CHECK (
    ((SELECT ýÕÑ ¹©ÝÐ ¤¤´øÁÁ}µÑÑ´øøÉ½±¤ôµ¥¸(¤ì()ÿõ$TDRôÄ5$FÖç2WFFR&öGV7BGW2 ¤ôâV&Æ2ç&öOÝXÝÝ\\ÂÔTUBÈ]][XØ]YTÒSÈ


ÑSPÿT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
)
Wý%Q !, ( ¡M1PÕÑ ¹©ÝÐ ¤¤´øÁÁ}µÑÑ´ÿóâw&öÆRrÒvFÖâp¢° ¤5$TDRôÄ5$FÖç2FVÆWFR&öOÝXÝ\\ÈÓXXËÙXÝÝ\\ÂÔSUBÈ]][cated
USING (
    ((SELECT auth.jwt()) -> 'app_metadata' ü´øøÉ½±¤ôµ¥¸(¤ì((´´Ì¸½¹Í½±¥ÑÑ½ÉäÁ½±ÿö6W2à¤E$õôÄ5bU5E2$7FfR6FVv÷&W2&R&VF/ÛHÓXXËØ]YÛÜY\ÎÂÔÓPÖHQVTÕÈYZ[Èanage categories"
ON public.categories;

CREATE POLICY "AýÑ¥ÙÑ½É¥ÌÉÉ±)=8ÁÕ±¥¹Ñ½É¥Ì)=HÿôTÄT5@¥DòæöâÂWFVçF6FV@¥U4är¢5ö7FfRÒG'V_ÂÔ

ÑSPÕ]]Ý

JHO	Ø\ÛY]Y]IÈO	ÜÛIÿ) = 'admin'
);

CREATE POLICY "Admins insert categories"
ý=8ÁÕ±¥¹Ñ½É¥Ì)=H%9MIP)Q<ÕÑ¡¹Ñ¥Ñ)]%Q !ÿô4²¢4TÄT5BWFæ§wBÓâvöÖWFFFrÓãâw&öÆ_ÉÊHH	ØYZ[ÂNÂÔPUHÓPÖHYZ[È\]HØ]YÛÜY\È¿
ON public.categories
FOR UPDATE
TO authenticated
USING (ü( ¡M1PÕÑ ¹©ÝÐ ¤¤´øÁÁ}µÑÑ´øøÉ½±¤ÿòvFÖâp¢¥tD4T4²¢4TÄT5BWFæ§wBÓâvÿÛY]Y]IÈO	ÜÛIÊHH	ØYZ[ÂNÂÔPUHÓPÖHYZ[ÿ delete categories"
ON public.categories
FOR DELETE
TO auýÑ¡¹Ñ¥Ñ)UM%9 ( ¡M1PÕÑ ¹©ÝÐ ¤¤´øÁÁ}µÑÿöFFrÓãâw&öÆRrÒvFÖâp¢° ¢ÒÒBâ6öç6öÆFFRÖæË]XHYZ[ÛXÚY\ËÔÓPÖHQVTÕÈYZ[ÈX[ge product type category mappings"
ON public.product_typeý}Ñ½É¥Ìì()IQA=1%dµ¥¹Ì¥¹ÍÉÐÁÉ½ÕÐÑåÁÿöFVv÷'Öæw2 ¤ôâV&Æ2ç&öGV7E÷GUö6FVv÷&W0¤dõ"ÓÑTÈ]][XØ]YÒUÒPÒÈ


ÑSPÕ]]Ý?()) -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POý1%dµ¥¹ÌÕÁÑÁÉ½ÕÐÑåÁÑ½ÉäµÁÁ¥¹Ì)=8Áÿö&Æ2ç&öGV7E÷GUö6FVv÷&W0¤dõ"UDDP¥DòWFVçF6FV@¯ÕTÒSÈ


ÑSPÕ]]Ý

JHO	Ø\ÛY]Y]IÈO	Ü¿ole') = 'admin'
)
WITH CHECK (
    ((SELECT auth.jwt()) -üøÁÁ}µÑÑ´øøÉ½±¤ôµ¥¸(¤ì()IQA=1%dÿò$FÖç2FVÆWFR&öGV7BGR6FVv÷'Öæw2 ¤ôâV&Æ2ïÜÙXÝÝ\WØØ]YÛÜY\ÂÔSUBÈ]][XØ]YTÒSÿ (
    ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role')üôµ¥¸(¤ì((´´Ô¸½¹Í½±¥ÑÁÉ½ÕÐÁ½±¥¥ÌÝ¡¥±ÿ÷&W6W'fær6VÆÆW"&WfWr&W7G&7Föç2à¤E$õôÄ5bU?ÕÈYZ[ÈX[YÙH[ÙXÝÈÓXXËÙXÝÎÂÔ?POLICY IF EXISTS "Published products and owner products aýÉÉ±)=8ÁÕ±¥¹ÁÉ½ÕÑÌì)I=@A=1%d%a%MQLÿöVÆÆW'27V&ÖB&öGV7G2f÷"&WfWr ¤ôâV&Æ2ç&öGV7G3°¤E/ÓÔÓPÖHQVTÕÈÙ[\È\]HÝÛYÜZXÝY? products"
ON public.products;
DROP POLICY IF EXISTS "Selý±ÉÌ±Ñ½Ý¸ÉÐ½ÈÉ©ÑÁÉ½ÕÑÌ)=8ÁÕ±¥¹ÁÉÿöGV7G3° ¤5$TDRôÄ5%&öGV7G2f6&ÆG ¤ôâV&Æ2ç&ÿÙXÝÂÔÑSPÕÈ[Û]][XØ]YTÒSÈ
Ý]s = 'published'
    OR seller_id = (SELECT auth.uid())
  ü=H ¡M1PÕÑ ¹©ÝÐ ¤¤´øÁÁ}µÑÑ´øøÉ½±¤ÿòvFÖâp¢° ¤5$TDRôÄ5%&öGV7G27&VFöâ ¤ôâV&Æ2ïÜÙXÝÂÔSÑTÈ]][XØ]YÒUÒPÒÈ


ÿELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'ü(=H (Í±±É}¥ô¡M1PÕÑ ¹Õ¥ ¤¤(ÿòäB7FGW2âvG&gBrÂwVæFæu÷&WfWrr¢äBUÒTÕÈ
ÑSPÕBÓHXXËÙct_types AS pt
            JOIN public.categories AS c
  ü=8¹¥ôÁÕ±¥¹ÁÉ½ÕÑÌ¹Ñ½Éå}¥(ÿòtU$RBæBÒV&Æ2ç&öGV7G2ç&öGV7E÷GUö@¢ÈS\×ØXÝ]HHYBSË\×ÿactive = true
        )
    )
);

CREATE POLICY "ProductsüÕÁÑ)=8ÁÕ±¥¹ÁÉ½ÕÑÌ)=HUAQ)Q<ÕÑ¡¹Ñ¥Ñ)ÿõ4är¢4TÄT5BWFæ§wBÓâvöÖWFFFrÓãâw&ÿÛIÊHH	ØYZ[ÂÔ
Ù[\ÚYH
ÑSPÕ]]¿uid())
        AND status IN ('draft', 'rejected')
    )
ü¤)]%Q !, ( ¡M1PÕÑ ¹©ÝÐ ¤¤´øÁÁ}µÑÑÿòÓãâw&öÆRrÒvFÖâp¢õ"¢6VÆÆW%öBÒ4TÄ_ÐÕ]]ZY

JBSÝ]\ÈS
	ÙY	Ë	Ü[[×Ü¿eview')
    )
);

CREATE POLICY "Products deletion"
ON puý±¥¹ÁÉ½ÕÑÌ)=H1Q)Q<ÕÑ¡¹Ñ¥Ñ)UM%9 ( ¡ÿôTÄT5BWFæ§wBÓâvöÖWFFFrÓãâw&öÆRrÒvFÖâÂÔ
Ù[\ÚYH
ÑSPÕ]]ZY

JB? AND status IN ('draft', 'rejected')
    )
);

COMMIT;
