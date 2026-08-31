MOCK_VEHICLES = {
    1: {
        "name": "Toyota Corolla",
        "plate": "ABC-123",
        "status": "available",
        "location": "Beirut Branch",
        "daily_rate": 35,
    },
    2: {
        "name": "Hyundai Tucson",
        "plate": "XYZ-456",
        "status": "rented",
        "location": "Jounieh Branch",
        "daily_rate": 55,
    },
    3: {
        "name": "Kia Sportage",
        "plate": "DEF-789",
        "status": "maintenance",
        "location": "Beirut Branch",
        "daily_rate": 50,
    },
}


def get_vehicle_status(db, vehicle_id: int | None = None, **kwargs) -> dict:
    if vehicle_id is None:
        return {"error": "vehicle_id is required"}

    vehicle = MOCK_VEHICLES.get(vehicle_id)

    if not vehicle:
        return {"error": f"no vehicle found with id {vehicle_id}"}

    return {
        "vehicle_id": vehicle_id,
        "name": vehicle["name"],
        "plate": vehicle["plate"],
        "status": vehicle["status"],
    }


def get_vehicle_location(db, vehicle_id: int | None = None, **kwargs) -> dict:
    if vehicle_id is None:
        return {"error": "vehicle_id is required"}

    vehicle = MOCK_VEHICLES.get(vehicle_id)

    if not vehicle:
        return {"error": f"no vehicle found with id {vehicle_id}"}

    return {
        "vehicle_id": vehicle_id,
        "name": vehicle["name"],
        "location": vehicle["location"],
    }


def get_vehicle_details(db, vehicle_id: int | None = None, **kwargs) -> dict:
    if vehicle_id is None:
        return {"error": "vehicle_id is required"}

    vehicle = MOCK_VEHICLES.get(vehicle_id)

    if not vehicle:
        return {"error": f"no vehicle found with id {vehicle_id}"}

    return {
        "vehicle_id": vehicle_id,
        "name": vehicle["name"],
        "plate": vehicle["plate"],
        "status": vehicle["status"],
        "location": vehicle["location"],
        "daily_rate": vehicle["daily_rate"],
    }


def print_vehicle_table() -> None:
    """Print the mock vehicles in a simple table for testing."""

    print(
        f"{'ID':<4}"
        f"{'Vehicle':<20}"
        f"{'Plate':<12}"
        f"{'Status':<15}"
        f"{'Location':<18}"
        f"{'Daily Rate'}"
    )

    for vehicle_id, vehicle in MOCK_VEHICLES.items():
        print(
            f"{vehicle_id:<4}"
            f"{vehicle['name']:<20}"
            f"{vehicle['plate']:<12}"
            f"{vehicle['status']:<15}"
            f"{vehicle['location']:<18}"
            f"${vehicle['daily_rate']}"
        )


if __name__ == "__main__":
    print_vehicle_table()