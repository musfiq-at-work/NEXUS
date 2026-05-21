import { Image, View } from "@react-pdf/renderer";
import React from "react";
import { renaissanceImage } from "~/assets";

const RenaissanceLogo = () => {
	return (
		<View style={{ width: "100%", alignItems: "flex-end" }} fixed>
			{/* eslint-disable-next-line jsx-a11y/alt-text */}
			<Image style={{ width: "80px", height: "27px", textAlign: "right", marginBottom: 10 }}
				src={renaissanceImage.src}
			/>
		</View>
	);
};

export default React.memo(RenaissanceLogo);
