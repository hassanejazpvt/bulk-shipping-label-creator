"""
Management command to initialize sample saved addresses and packages
"""

from django.core.management.base import BaseCommand
from shipping_platform.apps.models import SavedAddress, SavedPackage


class Command(BaseCommand):
    help = "Initialize sample saved addresses and packages"

    def handle(self, *args, **options):
        # Clear existing data (optional)
        # SavedAddress.objects.all().delete()
        # SavedPackage.objects.all().delete()

        # Create sample addresses if they don't exist
        addresses_data = [
            {
                "name": "Print TTS",
                "first_name": "Print",
                "last_name": "TTS",
                "address": "502 W Arrow Hwy, STE P",
                "address2": "",
                "city": "San Dimas",
                "state": "CA",
                "zip_code": "91773",
                "phone": "",
                "is_default": True,
            },
            {
                "name": "Print TTS",
                "first_name": "Print",
                "last_name": "TTS",
                "address": "500 W Foothill Blvd, STE P",
                "address2": "",
                "city": "Claremont",
                "state": "CA",
                "zip_code": "91711",
                "phone": "",
                "is_default": False,
            },
            {
                "name": "Print TTS",
                "first_name": "Print",
                "last_name": "TTS",
                "address": "1170 Grove Ave",
                "address2": "",
                "city": "Ontario",
                "state": "CA",
                "zip_code": "91764",
                "phone": "",
                "is_default": False,
            },
        ]

        for addr_data in addresses_data:
            address, created = SavedAddress.objects.get_or_create(
                name=addr_data["name"],
                address=addr_data["address"],
                city=addr_data["city"],
                defaults=addr_data,
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f"Created address: {address.name} - {address.city}")
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f"Address already exists: {address.name} - {address.city}")
                )

        # Create sample packages if they don't exist
        packages_data = [
            {
                "name": "Light Package",
                "length": 6,
                "width": 6,
                "height": 6,
                "weight_lbs": 1,
                "weight_oz": 0,
            },
            {
                "name": "8 Oz Item",
                "length": 4,
                "width": 4,
                "height": 4,
                "weight_lbs": 0,
                "weight_oz": 8,
            },
            {
                "name": "Standard Box",
                "length": 12,
                "width": 12,
                "height": 12,
                "weight_lbs": 2,
                "weight_oz": 0,
            },
        ]

        for pkg_data in packages_data:
            package, created = SavedPackage.objects.get_or_create(
                name=pkg_data["name"], defaults=pkg_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created package: {package.name}"))
            else:
                self.stdout.write(self.style.WARNING(f"Package already exists: {package.name}"))

        self.stdout.write(self.style.SUCCESS("Sample data initialization completed!"))
