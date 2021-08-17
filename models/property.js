const new_property = (body, files) => {
  try {
    const new_property = {
      property_name: body.property_name,
      property_type: body.property_type,
      contract: body.contract,
      area: Number.parseFloat(body.area, 10),
      price: Number.parseFloat(body.price, 10),
      rent_payment: body.rent_payment,
      rent_requirement: body.rent_requirement,
      bedroom: body.bedroom,
      bathroom: body.bathroom,
      district: body.district,
      province: body.province,
      near_station: body.near_station,
      maps_query: body.maps_query,
      furnishing: body.furnishing,
      ownership: body.ownership,
      facilities: {
        air_conditioning: body.air_conditioning === "true" ? true : false,
        balcony: body.balcony === "true" ? true : false,
        cctv: body.cctv === "true" ? true : false,
        concierge: body.concierge === "true" ? true : false,
        fitness: body.fitness === "true" ? true : false,
        garden: body.garden === "true" ? true : false,
        library: body.library === "true" ? true : false,
        lift: body.lift === "true" ? true : false,
        parking: body.parking === "true" ? true : false,
        playground: body.playground === "true" ? true : false,
        pet_friendly: body.pet_friendly === "true" ? true : false,
        river_view: body.river_view === "true" ? true : false,
        security: body.security === "true" ? true : false,
        single_storey: body.single_storey === "true" ? true : false,
        swimming_pool: body.swimming_pool === "true" ? true : false,
        sport_center: body.sport_center === "true" ? true : false,
        tv: body.tv === "true" ? true : false,
        wifi: body.wifi === "true" ? true : false,
      },
      description: body.description,
      images: {
        image_cover: files.image_cover,
        image_1: files.image_1,
        image_2: files.image_2,
        image_3: files.image_3,
        image_4: files.image_4,
        image_5: files.image_5,
        image_6: files.image_6,
        image_7: files.image_7,
        image_8: files.image_8,
        image_9: files.image_9,
        image_10: files.image_10,
      },
    };
    return new_property;
  } catch (err) {
    console.error(err.stack);
    return null;
  }
};

module.exports = {
  new_property,
};
