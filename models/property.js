const new_property = (body, files) => {
  try {
    const new_property = {
      property_name: body.property_name,
      property_type: body.property_type,
      price: Number.parseFloat(body.price, 10),
      contract_type: body.contract_type,
      ownership: body.ownership,
      rent_payment: body.rent_payment,
      rent_requirement: body.rent_requirement,
      area: Number.parseFloat(body.area, 10),
      bedroom: body.bedroom,
      bathroom: body.bathroom,
      furnishing: body.furnishing,
      description: body.description,
      district: body.district,
      province: body.province,
      near_station: body.near_station,
      maps_query: body.maps_query,
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

const property = (query) => {
  try {
    const property = {
      owner_id: query.owner_id,
      property_id: query.property_id,
      status: query.status,
      property_name: query.property_name,
      property_type: query.property_type,
      price: Number.parseFloat(query.price, 10),
      contract_type: query.contract_type,
      ownership: query.ownership,
      rent_payment: query.rent_payment,
      rent_requirement: query.rent_requirement,
      area: Number.parseFloat(query.area, 10),
      bedroom: query.bedroom,
      bathroom: query.bathroom,
      furnishing: query.furnishing,
      description: query.description,
      seen: Number.parseInt(query.seen),
      district: query.district,
      province: query.province,
      near_station: query.near_station,
      maps_query: query.maps_query,
      facilities: {
        air_conditioning: query.air_conditioning,
        balcony: query.balcony,
        cctv: query.cctv,
        concierge: query.concierge,
        fitness: query.fitness,
        garden: query.garden,
        library: query.library,
        lift: query.lift,
        parking: query.parking,
        playground: query.playground,
        pet_friendly: query.pet_friendly,
        river_view: query.river_view,
        security: query.security,
        single_storey: query.single_storey,
        swimming_pool: query.swimming_pool,
        sport_center: query.sport_center,
        tv: query.tv,
        wifi: query.wifi,
      },
      images: {
        image_cover: query.image_cover,
        image_1: query.image_1,
        image_2: query.image_2,
        image_3: query.image_3,
        image_4: query.image_4,
        image_5: query.image_5,
        image_6: query.image_6,
        image_7: query.image_7,
        image_8: query.image_8,
        image_9: query.image_9,
        image_10: query.image_10,
      },
    };
    return property;
  } catch (err) {
    console.error(err.stack);
    return null;
  }
};

const update_data = (body, files) => {
  try {
    let update_data = {
      info: {},
      images: {},
      buyer: null,
      isChange: false,
    };
    if (body) {
      for (let attribute in body) {
        switch (attribute) {
          case "image_cover":
          case "image_1":
          case "image_2":
          case "image_3":
          case "image_4":
          case "image_5":
          case "image_6":
          case "image_7":
          case "image_8":
          case "image_9":
          case "image_10":
            update_data.images[attribute] = body[attribute];
            update_data.isChange = true;
            break;
          case "buyer":
            update_data.buyer = body[attribute];
            update_data.isChange = true;
            break;
          default:
            update_data.info[attribute] = body[attribute];
            update_data.isChange = true;
        }
      }
    }
    if (files) {
      for (let attribute in files) {
        update_data.images[attribute] = files[attribute];
        update_data.isChange = true;
      }
    }
    return update_data;
  } catch (err) {
    console.error(err.stack);
    return null;
  }
};

module.exports = {
  new_property,
  property,
  update_data,
};
